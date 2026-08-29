(function () {
'use strict';

/*
 * Drop-in rsvp-addon.js
 *
 * Original source is pinned to commit:
 * 94966407f843a8951c35d98dd19d168faf33a5ab
 *
 * Changes:
 * - whoiscoming.PNG is used by the pinned original.
 * - Bride and groom are placed closer together.
 * - Guests fill rows in the requested order.
 * - Name and phone last 4 digits are placed on one row.
 * - Phone label is shortened to "전화번호 뒷4자리".
 * - Gender is assigned automatically and its choices are hidden.
 * - Extra spacing is added above the male/female choices.
 * - A copy of the currently displayed wedding guest scene is shown
 *   directly below the RSVP submit button.
 * - "남겨주신 답변은 예식 준비에 소중히 사용하겠습니다." is moved
 *   to the bottom, directly above the privacy notice.
 */

const ORIGINAL_SCRIPT_URL =
    'https://cdn.jsdelivr.net/gh/gna-king/happy-wedding-day@94966407f843a8951c35d98dd19d168faf33a5ab/rsvp-addon.js';

const LAYOUT_STYLE_ID = 'weddingRsvpRequestedLayoutStyle';
const FORM_STYLE_ID = 'weddingRsvpFormRequestedStyle';

/*
 * ============================================================
 * Wedding RSVP v2.6 - No Bottom Toast + Story Guide / 여기만 수정하면 대부분 변경 가능
 * ============================================================
 */
const UI = {
    titleSize: 20,          // "참석 의사를 알려주세요"
    guideSize: 11,          // "참석 버튼을 누르면..."
    questionSize: 13,       // 각 질문
    inputLabelSize: 13,     // 이름 / 전화번호 뒷4자리
    inputTextSize: 14,      // 입력칸 안 글자
    optionSize: 14,         // 신랑측/신부측, 참석/불참, 남성/여성
    submitButtonSize: 15,   // 참석 의사 전달하기
    laterButtonSize: 15,    // 나중에 답할게요
    previewTitleSize: 12,   // 함께하고 있는 하객들
    bottomNoteSize: 12,     // 하단 안내문

    nameBubbleSize: 11,     // 캐릭터 클릭 시 이름
    nameBubbleDuration: 1500 // 이름 표시 시간(ms)
};

const LAYOUT = {
    coupleGap: -24,         // 더 음수일수록 신랑/신부가 가까워짐
    coupleScale: 0.66,      // 신랑/신부 크기
    coupleBottom: 7,        // 신랑/신부 세로 위치(%)

    firstGuestDistance: 12.5,
    guestGap: 6.4,
    rowGap: 7.5,
    rowInset: 1.8
};

const DECORATIVE_GROOM_GUEST_COUNT = 10;

const CROWD = {
    // 한쪽은 5줄, 한 줄은 기본 4명 + 양옆 2명까지 우선 배치
    maxRows: 5,
    initialGuestsPerRow: 4,
    extraGuestsPerRow: 2,
    preferredSideCapacity: 30,

    // 양쪽 5×6 자리가 찬 뒤부터 전체 캐릭터를 자동 축소
    normalUntil: 30,
    compactUntil: 45,

    normalScaleMultiplier: 1.00,
    compactScaleMultiplier: 0.88,
    denseScaleMultiplier: 0.76,

    // 캐릭터가 너무 작아지지 않도록 제한
    minimumCharacterScale: 0.34,

    // 가장 뒤쪽 하객이 올라갈 수 있는 최대 높이(%)
    maxBackPosition: 88,

    // 한쪽 초과 시 반대쪽 빈자리 사용
    overflowToOtherSide: true
};

const TEAM = {
    groomRibbon: '#4F73B8',     // 신랑측 하객 목리본
    brideRibbon: '#E88AA7',     // 신부측 하객 목리본

    groomBoutonniereFlower: '#E9B7BD',
    groomBoutonniereLeaf: '#6F915B',

    brideHair: '#3D2B25',
    brideVeil: '#F4F1EC',
    brideVeilShadow: '#DDD7CF',
    brideBouquetFlower1: '#F0B8C2',
    brideBouquetFlower2: '#FFF0D9',
    brideBouquetLeaf: '#73945F'
};

const TEXT = {
    popupTitle: '참석 의사를 알려주세요',
    popupGuide: '참석 버튼을 누르면 개인 캐릭터를 생성할 수 있습니다 😄',
    genderQuestion: '성별을 알려주세요',
    phoneLabel: '전화번호 뒷4자리',
    previewTitle: '함께하고 있는 하객들',
    guestSectionTitle: '함께해주시는 소중한 분들', 
    bottomNote: '남겨주신 답변은 예식 준비에 소중히 사용하겠습니다.'
};

const DEBUG = false;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[Wedding RSVP]', ...args);
    }
}

function loadOriginalScript() {
    return new Promise(async (resolve, reject) => {
        const existing = document.querySelector(
            `script[data-rsvp-original="${ORIGINAL_SCRIPT_URL}"]`
        );

        if (existing) {
            if (existing.dataset.loaded === 'true') {
                resolve();
                return;
            }

            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', reject, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.async = false;
        script.dataset.rsvpOriginal = ORIGINAL_SCRIPT_URL;

        try {
            const response = await fetch(ORIGINAL_SCRIPT_URL, {
                cache: 'force-cache'
            });

            if (!response.ok) {
                throw new Error(
                    `Original RSVP request failed: ${response.status}`
                );
            }

            const originalSource = await response.text();
            const fasterSource = originalSource.replace(
                'setTimeout(openRsvpModal,450)',
                'setTimeout(openRsvpModal,80)'
            );

            script.textContent =
                fasterSource +
                '\n//# sourceURL=wedding-rsvp-original.js';

            document.head.appendChild(script);
            script.dataset.loaded = 'true';
            resolve();
        } catch (error) {
            /*
             * 인라인 로딩이 실패하면 기존 외부 스크립트 방식으로 복구한다.
             * 이 경우에도 참석 기능 자체는 정상 동작한다.
             */
            script.src = ORIGINAL_SCRIPT_URL;

            script.addEventListener(
                'load',
                () => {
                    script.dataset.loaded = 'true';
                    resolve();
                },
                { once: true }
            );

            script.addEventListener('error', reject, { once: true });
            document.head.appendChild(script);
        }
    });
}

function addRequestedLayoutStyle() {
    if (document.getElementById(LAYOUT_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = LAYOUT_STYLE_ID;

    style.textContent = `
        .group-photo-layer {
            position: absolute !important;
            inset: 0 !important;
            z-index: 3 !important;
            pointer-events: none !important;
        }

        .couple-layer {
            position: absolute !important;
            left: 50% !important;
            bottom: ${LAYOUT.coupleBottom}% !important;
            transform: translateX(-50%) !important;
            display: flex !important;
            align-items: flex-end !important;
            gap: 0 !important;
            z-index: 100 !important;
        }

        .couple-layer .pixel-char {
            transform: scale(${LAYOUT.coupleScale}) !important;
            transform-origin: bottom center !important;
        }

        .couple-layer .pixel-char:first-child {
            margin-right: ${LAYOUT.coupleGap}px !important;
        }

        .side-guests,
        .side-guests.left,
        .side-guests.right {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            display: block !important;
            pointer-events: none !important;
        }

        .side-guests .pixel-char {
            position: absolute !important;
            width: 48px !important;
            height: 56px !important;
            margin: 0 !important;
            transform-origin: bottom center !important;
        }

        .side-guests .pixel-char.back {
            margin-bottom: 0 !important;
        }

        /* 하객 캐릭터 클릭 가능 */
        .side-guests .pixel-char {
            pointer-events: auto !important;
            cursor: pointer !important;
            touch-action: manipulation !important;
        }

        /* 캐릭터 클릭 시 이름 말풍선 */
        .guest-name-bubble {
            position: fixed !important;
            z-index: 20000 !important;
            transform: translate(-50%, -100%) scale(.92);
            padding: 7px 10px !important;
            background: rgba(255, 253, 249, .98) !important;
            border: 2px solid #5d544d !important;
            box-shadow: 3px 3px 0 rgba(0,0,0,.18) !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: ${UI.nameBubbleSize}px !important;
            line-height: 1 !important;
            color: #4d4540 !important;
            text-align: center !important;
            white-space: nowrap !important;
            pointer-events: none !important;
            opacity: 0;
            transition: opacity .14s ease, transform .14s ease;
        }

        .guest-name-bubble.is-visible {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
        }

        .guest-name-bubble::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 100%;
            width: 7px;
            height: 7px;
            background: #fffdf9;
            border-right: 2px solid #5d544d;
            border-bottom: 2px solid #5d544d;
            transform: translate(-50%, -4px) rotate(45deg);
        }

        /* 신랑측/신부측 구역 글자는 표시하지 않음 */
        .pixel-side-labels {
            display: none !important;
        }
    `;

    document.head.appendChild(style);
}

function addRequestedFormStyle() {
    if (document.getElementById(FORM_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = FORM_STYLE_ID;

    style.textContent = `
        /*
         * iOS Chrome의 주소창을 제외한 실제 화면 높이에 팝업을 맞춘다.
         * 기존 100vh 중앙 정렬로 상단이 잘리는 현상을 방지한다.
         */
        .rsvp-modal {
            height: 100dvh !important;
            min-height: 100dvh !important;
            padding-top: max(18px, env(safe-area-inset-top)) !important;
            padding-bottom: max(18px, env(safe-area-inset-bottom)) !important;
            box-sizing: border-box !important;
        }

        .rsvp-dialog {
            max-height: 100% !important;
            overscroll-behavior: contain !important;
        }

        /*
         * 모바일 첫 화면에 하객 미리보기 제목까지 보이도록
         * 질문 영역의 세로 여백을 균형 있게 압축한다.
         */
        .rsvp-dialog-header {
            padding: 18px 20px 12px !important;
        }

        .rsvp-dialog-kicker {
            margin-bottom: 6px !important;
        }

        .rsvp-dialog-title {
            margin-bottom: 4px !important;
        }

        .rsvp-form {
            padding: 15px 18px 16px !important;
        }

        #rsvpForm > .form-group:not(.character-customizer):not(.rsvp-gender-group) {
            margin-bottom: 13px !important;
        }

        #rsvpForm > .form-group > .form-label {
            margin-bottom: 7px !important;
        }

        #rsvpForm > .form-group .choice-item span {
            min-height: 42px !important;
            padding-top: 6px !important;
            padding-bottom: 6px !important;
        }

        .rsvp-name-phone-row .text-input,
        .rsvp-name-phone-row input {
            height: 43px !important;
        }

        /*
         * 입력칸과 전달 버튼은 너무 붙지 않도록 별도 간격을 둔다.
         */
        #rsvpSubmit {
            margin-top: 14px !important;
        }

        /* 모바일에서도 닫기 버튼이 잘 보이고 쉽게 눌리도록 터치 영역 확대 */
        #rsvpCloseX {
            width: 50px !important;
            height: 50px !important;
            min-width: 50px !important;
            min-height: 50px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 48px !important;
            line-height: 1 !important;
            font-weight: 700 !important;
            padding: 0 !important;
            cursor: pointer !important;
            touch-action: manipulation !important;
        }

        /* 모든 질문 문구 크기 통일
           기존 큰 질문 글자의 절반 정도 크기로 표시 */
        .form-group > .form-label {
            font-size: ${UI.questionSize}px !important;
            line-height: 1.45 !important;
            letter-spacing: 0 !important;
        }

        /* 참석 질문 바로 아래 캐릭터 생성 안내 */
        .rsvp-character-guide {
            display: block !important;
            width: 100% !important;
            margin: 8px 0 0 0 !important;
            padding: 0 !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: ${UI.guideSize}px !important;
            line-height: 1.55 !important;
            color: #9a6d62 !important;
            text-align: center !important;
            position: static !important;
            transform: none !important;
            white-space: normal !important;
        }

        /* 이름 + 전화번호 뒷4자리 한 줄 */
        .rsvp-name-phone-row {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
            gap: 10px !important;
            align-items: end !important;
            width: 100% !important;
            margin-bottom: 0 !important;
        }

        .rsvp-name-phone-row .form-group {
            min-width: 0 !important;
            margin-bottom: 0 !important;
        }

        .rsvp-name-phone-row .form-label {
            white-space: nowrap !important;
            font-size: ${UI.inputLabelSize}px !important;
            line-height: 1.45 !important;
        }

        .rsvp-name-phone-row .text-input,
        .rsvp-name-phone-row input {
            width: 100% !important;
            min-width: 0 !important;
        }

        /* 성별 값은 캐릭터 생성용으로만 자동 지정하고 화면에서는 숨김 */
        .rsvp-gender-group {
            display: none !important;
        }

        /* 제출 버튼 아래 현재 참여 캐릭터 장면 */
        .rsvp-live-scene-wrap {
            position: relative !important;
            margin-top: 12px !important;
            padding-top: 10px !important;
            border-top: 2px dashed #d8d0c8 !important;
        }

        /*
         * 제목을 그림 위쪽 안에 픽셀 명패처럼 겹쳐 표시한다.
         * 바깥 제목 한 줄을 없애 미리보기가 더 위에서 시작된다.
         */
        .rsvp-live-scene-title {
            position: absolute !important;
            z-index: 20 !important;
            top: 22px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: ${UI.previewTitleSize}px !important;
            line-height: 1.2 !important;
            color: #fff !important;
            text-shadow:
                0 1px 0 #111,
                1px 0 0 #111,
                0 -1px 0 #111,
                -1px 0 0 #111,
                1px 1px 0 #111,
                -1px 1px 0 #111,
                1px -1px 0 #111,
                -1px -1px 0 #111 !important;
            text-align: center !important;
            white-space: nowrap !important;
            pointer-events: none !important;
        }

        .rsvp-live-scene {
            position: relative !important;
            width: 100% !important;
            overflow: hidden !important;
        }

        .rsvp-live-scene .pixel-scene {
            width: 100% !important;
            margin: 0 !important;
        }

        .rsvp-live-scene .pixel-empty {
            display: none !important;
        }

        /* 하단 안내문 */
        .rsvp-bottom-note-wrap {
            margin-top: 18px !important;
            padding-top: 16px !important;
            text-align: center !important;
            border-top: 1px solid #e4ddd7 !important;
        }

        .rsvp-bottom-note {
            display: block !important;
            margin: 16px 0 8px 0 !important;
            text-align: center !important;
            font-size: ${UI.bottomNoteSize}px !important;
            line-height: 1.7 !important;
            color: #9a6d62 !important;
        }


        /* RSVP v2 - 제목/입력/선택지/버튼 크기 */
        .rsvp-v2-title {
            font-size: ${UI.titleSize}px !important;
        }

        .rsvp-v2-input {
            font-size: ${UI.inputTextSize}px !important;
        }

        .rsvp-v2-option,
        .rsvp-v2-option * {
            font-size: ${UI.optionSize}px !important;
        }

        .rsvp-v2-submit {
            font-size: ${UI.submitButtonSize}px !important;
        }

        .rsvp-v2-later {
            font-size: ${UI.laterButtonSize}px !important;
        }

        /* 원본 RSVP 하단 검은 토스트 완전 숨김 */
        #toast,
        .toast {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }

        /* RSVP 제출 후 맨 위 스토리 버튼 유도 */
        .story-button-rsvp-focus {
            position: relative !important;
            z-index: 9999 !important;
            animation: rsvp-story-pulse .8s ease-in-out 3 !important;
            box-shadow: 0 0 0 0 rgba(154, 109, 98, .35) !important;
        }

        @keyframes rsvp-story-pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(154, 109, 98, 0);
            }
            50% {
                transform: scale(1.035);
                box-shadow: 0 0 0 9px rgba(154, 109, 98, .16);
            }
        }

        .rsvp-story-guide {
            position: fixed !important;
            top: max(12px, env(safe-area-inset-top)) !important;
            left: 50% !important;
            transform: translateX(-50%) translateY(-8px) !important;
            z-index: 30000 !important;
            width: min(calc(100% - 32px), 390px) !important;
            padding: 12px 14px !important;
            border: 2px solid #8f7a70 !important;
            border-radius: 12px !important;
            background: rgba(255, 252, 248, .98) !important;
            color: #5c5049 !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: 12px !important;
            line-height: 1.55 !important;
            text-align: center !important;
            box-shadow: 4px 4px 0 rgba(93, 84, 77, .18) !important;
            opacity: 0;
            pointer-events: none !important;
            transition: opacity .2s ease, transform .2s ease !important;
        }

        .rsvp-story-guide.is-visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0) !important;
        }

        /* 데스크톱에서도 RSVP 내부 비율을 유지한 채 전체 확대 */
        @media (min-width: 768px) {
            .rsvp-dialog {
                width: min(100%, 390px) !important;
                max-height: calc(83.333dvh - 30px) !important;
                transform: scale(1.2) !important;
                transform-origin: center center !important;
            }
        }

        @media (max-width: 350px) {
            .rsvp-name-phone-row {
                grid-template-columns: 1fr 1fr !important;
                gap: 7px !important;
            }

            .rsvp-name-phone-row .form-label {
                font-size: ${UI.inputLabelSize}px !important;
            }
        }
    `;

    document.head.appendChild(style);
}

/*
 * 한쪽 좌석 배치 순서:
 *
 * 1단계: 앞줄부터 다섯 줄에 4명씩 배치
 * 2단계: 앞줄부터 각 줄 양옆에 2명씩 추가
 * 3단계: 5×6 좌석이 찬 뒤에는 새 줄 없이 앞줄부터 1명씩 추가
 */
function createSeatOrder(count) {
    const seats = [];
    const rows = CROWD.maxRows;
    const initialPerRow =
        CROWD.initialGuestsPerRow;
    const extraPerRow =
        CROWD.extraGuestsPerRow;

    for (
        let row = 0;
        row < rows && seats.length < count;
        row++
    ) {
        for (
            let position = 0;
            position < initialPerRow &&
            seats.length < count;
            position++
        ) {
            seats.push({ row, position });
        }
    }

    for (
        let row = 0;
        row < rows && seats.length < count;
        row++
    ) {
        for (
            let extra = 0;
            extra < extraPerRow &&
            seats.length < count;
            extra++
        ) {
            seats.push({
                row,
                position: initialPerRow + extra
            });
        }
    }

    let overflowIndex = 0;

    while (seats.length < count) {
        seats.push({
            row: overflowIndex % rows,
            position:
                initialPerRow +
                extraPerRow +
                Math.floor(overflowIndex / rows)
        });

        overflowIndex++;
    }

    return seats;
}

function getCrowdMetrics(count, seats) {
    let scaleMultiplier = CROWD.normalScaleMultiplier;

    if (count > CROWD.compactUntil) {
        scaleMultiplier = CROWD.denseScaleMultiplier;
    } else if (count > CROWD.normalUntil) {
        const ratio =
            (count - CROWD.normalUntil) /
            (CROWD.compactUntil - CROWD.normalUntil);

        scaleMultiplier =
            CROWD.normalScaleMultiplier -
            (
                CROWD.normalScaleMultiplier -
                CROWD.compactScaleMultiplier
            ) * ratio;
    }

    const maxRow = seats.length
        ? Math.max(...seats.map((seat) => seat.row))
        : 0;

    /*
     * 하객 수가 늘어서 뒷줄이 많아지면 rowGap을 자동으로 압축.
     * 가장 뒤쪽 하객이 maxBackPosition을 넘지 않게 한다.
     */
    let rowGap = LAYOUT.rowGap;

    if (maxRow > 0) {
        rowGap = Math.min(
            LAYOUT.rowGap,
            (
                CROWD.maxBackPosition -
                LAYOUT.coupleBottom
            ) / maxRow
        );
    }

    /*
     * 인원이 많아지면 가로 간격도 살짝 줄여
     * 화면 밖으로 퍼지는 것을 방지.
     */
    let guestGap = LAYOUT.guestGap;

    if (count > CROWD.compactUntil) {
        guestGap *= 0.78;
    } else if (count > CROWD.normalUntil) {
        const ratio =
            (count - CROWD.normalUntil) /
            (CROWD.compactUntil - CROWD.normalUntil);

        guestGap *= 1 - 0.22 * ratio;
    }

    /*
     * 한 줄에 7명 이상 들어가도 화면 밖으로 잘리지 않도록
     * 가장 바깥 좌석을 기준으로 가로 간격을 한 번 더 제한한다.
     */
    const maxPosition = seats.length
        ? Math.max(...seats.map((seat) => seat.position))
        : 0;

    if (maxPosition > 0) {
        guestGap = Math.min(
            guestGap,
            (47 - LAYOUT.firstGuestDistance) / maxPosition
        );
    }

    return {
        scaleMultiplier,
        rowGap,
        guestGap
    };
}

function getSeatStyle(
    seat,
    side,
    metrics
) {
    const distance =
        LAYOUT.firstGuestDistance +
        seat.position * metrics.guestGap;

    /*
     * 뒤쪽 캐릭터가 작아질수록 빈 공간이 넓어 보이지 않도록
     * 줄 사이 간격도 0.5%씩 줄인다.
     */
    let bottom = LAYOUT.coupleBottom;

    for (let row = 0; row < seat.row; row++) {
        bottom += Math.max(
            5.5,
            metrics.rowGap - row * 0.5
        );
    }

    const rowInset = Math.min(
        seat.row * LAYOUT.rowInset,
        9
    );

    const left = side === 'groom'
        ? 50 - distance + rowInset
        : 50 + distance - rowInset;

    /*
     * 뒤로 갈수록 작아지는 기존 원근감 +
     * 전체 인원 수에 따른 추가 자동 축소.
     */
    const perspectiveScale = Math.max(
        0.46,
        0.64 - seat.row * 0.025
    );

    const scale = Math.max(
        CROWD.minimumCharacterScale,
        perspectiveScale *
            metrics.scaleMultiplier
    );

    return {
        left,
        bottom,
        scale,
        zIndex: 80 - seat.row
    };
}

function arrangeVisualSide(
    guests,
    side,
    sharedDensityCount = guests.length
) {
    if (!guests.length) return;

    const seats =
        createSeatOrder(guests.length);

    const metrics =
        getCrowdMetrics(
            sharedDensityCount,
            seats
        );

    guests.forEach((guest, index) => {
        const style = getSeatStyle(
            seats[index],
            side,
            metrics
        );

        guest.classList.remove('back');

        guest.dataset.visualSide = side;

        guest.style.setProperty(
            'left',
            `${style.left}%`,
            'important'
        );

        guest.style.setProperty(
            'bottom',
            `${style.bottom}%`,
            'important'
        );

        guest.style.setProperty(
            'transform',
            `translateX(-50%) scale(${style.scale})`,
            'important'
        );

        guest.style.setProperty(
            'z-index',
            String(style.zIndex),
            'important'
        );
    });
}

function buildVisualGuestLists(
    groomGuests,
    brideGuests
) {
    const groomVisual = [...groomGuests];
    const brideVisual = [...brideGuests];

    if (!CROWD.overflowToOtherSide) {
        return {
            groomVisual,
            brideVisual
        };
    }

    const capacity =
        CROWD.preferredSideCapacity;

    /*
     * 신부측이 capacity를 넘고 신랑측 자리가 남으면,
     * 초과한 신부 하객만 화면상 신랑측 빈자리로 보낸다.
     *
     * DOM/Firebase 소속은 바꾸지 않기 때문에
     * 핑크 목리본도 그대로 유지된다.
     */
    if (
        brideVisual.length > capacity &&
        groomVisual.length < capacity
    ) {
        const excess =
            brideVisual.length - capacity;

        const available =
            capacity - groomVisual.length;

        const moveCount =
            Math.min(excess, available);

        const movedGuests =
            brideVisual.splice(
                brideVisual.length - moveCount,
                moveCount
            );

        groomVisual.push(...movedGuests);
    }

    /*
     * 신랑측이 많은 경우도 동일하게 처리.
     */
    if (
        groomVisual.length > capacity &&
        brideVisual.length < capacity
    ) {
        const excess =
            groomVisual.length - capacity;

        const available =
            capacity - brideVisual.length;

        const moveCount =
            Math.min(excess, available);

        const movedGuests =
            groomVisual.splice(
                groomVisual.length - moveCount,
                moveCount
            );

        brideVisual.push(...movedGuests);
    }

    return {
        groomVisual,
        brideVisual
    };
}

function svgRect(svg, x, y, width, height, fill, className = '') {
    if (!svg) return null;

    const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
    );

    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('fill', fill);

    if (className) {
        rect.setAttribute('class', className);
    }

    svg.appendChild(rect);
    return rect;
}

function removeWeddingDecorations(character) {
    if (!character) return;

    character
        .querySelectorAll('.wedding-v2-decoration')
        .forEach((node) => node.remove());
}

function addGuestRibbon(character, side) {
    if (!character) return;

    const svg = character.querySelector('svg');
    if (!svg) return;

    /*
     * 24x28 픽셀 캐릭터의 목 바로 아래에
     * 3픽셀 폭의 작은 나비리본을 추가한다.
     */
    const color =
        side === 'bride'
            ? TEAM.brideRibbon
            : TEAM.groomRibbon;

    /*
     * 축소된 하객에서도 리본이 몸통에 묻히지 않도록
     * 진한 외곽선을 먼저 그리고 색상 리본을 그 위에 올린다.
     */
    svgRect(
        svg,
        8,
        14,
        4,
        4,
        '#2A2523',
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        12,
        14,
        4,
        4,
        '#2A2523',
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        10,
        15,
        4,
        4,
        '#2A2523',
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        9,
        15,
        2,
        2,
        color,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        13,
        15,
        2,
        2,
        color,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        11,
        16,
        2,
        2,
        color,
        'wedding-v2-decoration'
    );

    character.dataset.weddingSide = side;
}

function decorateGroom(character) {
    if (!character) return;

    const svg = character.querySelector('svg');
    if (!svg) return;

    /*
     * 신랑 가슴의 작은 부토니에.
     * 기존 턱시도/나비넥타이는 그대로 유지한다.
     */
    svgRect(
        svg,
        15,
        17,
        2,
        2,
        TEAM.groomBoutonniereLeaf,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        14,
        16,
        2,
        2,
        TEAM.groomBoutonniereFlower,
        'wedding-v2-decoration'
    );
}


function removeBrideLongHair(svg) {
    if (!svg) return;

    const longHairRects = [
        ['2', '8', '6', '16'],
        ['16', '8', '6', '16'],
        ['3', '9', '5', '14'],
        ['16', '9', '5', '14']
    ];

    Array.from(svg.querySelectorAll('rect')).forEach((rect) => {
        const signature = [
            rect.getAttribute('x'),
            rect.getAttribute('y'),
            rect.getAttribute('width'),
            rect.getAttribute('height')
        ];

        const isLongHair = longHairRects.some((target) =>
            target.every((value, index) => value === signature[index])
        );

        if (isLongHair) {
            rect.remove();
        }
    });
}

function decorateBride(character) {
    if (!character) return;

    const svg = character.querySelector('svg');
    if (!svg) return;

    removeBrideLongHair(svg);

    /*
     * 기존 신부 머리 위에 웨딩 번(똥머리)을 덧그린다.
     * 머리 뒤쪽의 베일을 먼저 그리고, 번을 위에 올린다.
     */

    /* veil - 머리 뒤에서 양쪽으로 살짝 떨어지는 형태 */
    svgRect(
        svg,
        3,
        5,
        3,
        10,
        TEAM.brideVeilShadow,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        18,
        5,
        3,
        10,
        TEAM.brideVeilShadow,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        4,
        4,
        3,
        10,
        TEAM.brideVeil,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        17,
        4,
        3,
        10,
        TEAM.brideVeil,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        6,
        3,
        12,
        2,
        TEAM.brideVeil,
        'wedding-v2-decoration'
    );

    /* bun */
    svgRect(
        svg,
        9,
        1,
        6,
        2,
        '#2A2523',
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        10,
        0,
        4,
        3,
        TEAM.brideHair,
        'wedding-v2-decoration'
    );

    /*
     * 작은 부케.
     * 신부 오른손 쪽에 붙여 몸과 함께 움직이게 한다.
     */
    svgRect(
        svg,
        18,
        19,
        2,
        5,
        TEAM.brideBouquetLeaf,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        16,
        18,
        3,
        3,
        TEAM.brideBouquetFlower1,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        19,
        17,
        3,
        3,
        TEAM.brideBouquetFlower2,
        'wedding-v2-decoration'
    );

    svgRect(
        svg,
        19,
        20,
        3,
        3,
        TEAM.brideBouquetFlower1,
        'wedding-v2-decoration'
    );
}

function decorateWeddingCharacters() {
    const groomLayer =
        document.getElementById('groomGuestLayer');

    const brideLayer =
        document.getElementById('brideGuestLayer');

    const coupleLayer =
        document.getElementById('coupleLayer');

    if (groomLayer) {
        groomLayer
            .querySelectorAll(':scope > .pixel-char')
            .forEach((character) => {
                removeWeddingDecorations(character);
                addGuestRibbon(character, 'groom');
            });
    }

    if (brideLayer) {
        brideLayer
            .querySelectorAll(':scope > .pixel-char')
            .forEach((character) => {
                removeWeddingDecorations(character);
                addGuestRibbon(character, 'bride');
            });
    }

    if (coupleLayer) {
        const couple =
            coupleLayer.querySelectorAll(':scope > .pixel-char');

        if (couple[0]) {
            removeWeddingDecorations(couple[0]);
            decorateGroom(couple[0]);
        }

        if (couple[1]) {
            removeWeddingDecorations(couple[1]);
            decorateBride(couple[1]);
        }
    }
}

/*
 * 이름 없는 화면용 신랑 측 하객 10명.
 * 실제 RSVP/Firebase 데이터에는 저장하지 않는다.
 */
function ensureDecorativeGroomGuests() {
    const groomLayer =
        document.getElementById('groomGuestLayer');

    const brideLayer =
        document.getElementById('brideGuestLayer');

    if (!groomLayer || !brideLayer) return;

    const existing = Array.from(
        groomLayer.querySelectorAll(
            ':scope > .pixel-char.is-placeholder-guest'
        )
    );

    if (
        existing.length ===
        DECORATIVE_GROOM_GUEST_COUNT
    ) {
        return;
    }

    existing.forEach((character) => character.remove());

    const templates = [
        ...groomLayer.querySelectorAll(
            ':scope > .pixel-char:not(.is-placeholder-guest)'
        ),
        ...brideLayer.querySelectorAll(
            ':scope > .pixel-char:not(.is-placeholder-guest)'
        )
    ];

    if (!templates.length) {
        const coupleLayer =
            document.getElementById('coupleLayer');

        if (coupleLayer) {
            templates.push(
                ...coupleLayer.querySelectorAll(
                    ':scope > .pixel-char'
                )
            );
        }
    }

    if (!templates.length) return;

    for (
        let index = 0;
        index < DECORATIVE_GROOM_GUEST_COUNT;
        index++
    ) {
        const template =
            templates[
                Math.floor(
                    Math.random() * templates.length
                )
            ];

        const character =
            template.cloneNode(true);

        character.classList.remove(
            'back',
            'is-new'
        );

        character.classList.add(
            'is-placeholder-guest'
        );

        delete character.dataset.maskedName;
        character.removeAttribute('title');
        character.removeAttribute('aria-label');

        character
            .querySelectorAll('[id]')
            .forEach((element) => {
                element.removeAttribute('id');
            });

        groomLayer.appendChild(character);
    }
}

function updateDisplayedGuestCount() {
    const countElement =
        document.getElementById('guestCount');

    if (!countElement) return;

    const displayedGuests =
        document.querySelectorAll(
            '#groomGuestLayer > .pixel-char, ' +
            '#brideGuestLayer > .pixel-char'
        ).length;

    countElement.textContent =
        String(displayedGuests);
}

function arrangeAllGuests() {
    const groomLayer =
        document.getElementById('groomGuestLayer');

    const brideLayer =
        document.getElementById('brideGuestLayer');

    if (!groomLayer || !brideLayer) return;

    ensureDecorativeGroomGuests();

    const groomGuests = Array.from(
        groomLayer.querySelectorAll(
            ':scope > .pixel-char'
        )
    );

    const brideGuests = Array.from(
        brideLayer.querySelectorAll(
            ':scope > .pixel-char'
        )
    );

    /*
     * 실제 소속은 그대로 유지하고
     * 화면에 어디 배치할지만 재분배한다.
     */
    const {
        groomVisual,
        brideVisual
    } = buildVisualGuestLists(
        groomGuests,
        brideGuests
    );

    /*
     * 양쪽 30자리가 모두 찬 뒤에는 더 붐비는 쪽을 기준으로
     * 신랑측과 신부측 전체 크기를 똑같이 줄인다.
     */
    const sharedDensityCount = Math.max(
        groomVisual.length,
        brideVisual.length
    );

    arrangeVisualSide(
        groomVisual,
        'groom',
        sharedDensityCount
    );

    arrangeVisualSide(
        brideVisual,
        'bride',
        sharedDensityCount
    );

    /*
     * 목리본은 원래 DOM 소속 기준으로 그리므로
     * overflow 되어도 원래 색상이 유지된다.
     */
    decorateWeddingCharacters();
    applyMaskedNamesToCharacters();

    groomLayer
        .querySelectorAll(
            ':scope > .pixel-char.is-placeholder-guest'
        )
        .forEach((character) => {
            delete character.dataset.maskedName;
        });

    updateDisplayedGuestCount();

    debugLog('Smart Crowd', {
        realGroom: groomGuests.length,
        realBride: brideGuests.length,
        visualGroom: groomVisual.length,
        visualBride: brideVisual.length
    });

    syncLiveScene();
}


/* ============================================================
 * Guest Name Bubble
 * - 원래 이름은 공개하지 않음
 * - publicGuests에는 maskedName만 저장
 * - 2글자: 김철 -> 김*
 * - 3글자: 김진아 -> 김*아
 * - 4글자: 남궁민수 -> 남**수
 * ============================================================ */
function maskGuestName(name) {
    const value = String(name || '').trim();

    if (!value) return '';
    if (value.length === 1) return value;
    if (value.length === 2) return value[0] + '*';

    return (
        value[0] +
        '*'.repeat(value.length - 2) +
        value[value.length - 1]
    );
}

const PUBLIC_NAME_STATE = {
    groom: [],
    bride: [],
    connected: false
};

let guestNameBubbleTimer = null;

function removeGuestNameBubble() {
    const oldBubble =
        document.getElementById('guestNameBubble');

    if (oldBubble) {
        oldBubble.remove();
    }

    if (guestNameBubbleTimer) {
        clearTimeout(guestNameBubbleTimer);
        guestNameBubbleTimer = null;
    }
}

function showGuestNameBubble(character) {
    const maskedName =
        character?.dataset?.maskedName || '';

    if (!maskedName) return;

    removeGuestNameBubble();

    const rect =
        character.getBoundingClientRect();

    const bubble =
        document.createElement('div');

    bubble.id = 'guestNameBubble';
    bubble.className = 'guest-name-bubble';
    bubble.textContent = maskedName;

    /*
     * 화면 기준으로 캐릭터 머리 바로 위에 표시.
     */
    bubble.style.left =
        `${rect.left + rect.width / 2}px`;

    bubble.style.top =
        `${Math.max(10, rect.top - 4)}px`;

    document.body.appendChild(bubble);

    requestAnimationFrame(() => {
        bubble.classList.add('is-visible');
    });

    guestNameBubbleTimer =
        window.setTimeout(() => {
            bubble.classList.remove('is-visible');

            window.setTimeout(() => {
                if (bubble.isConnected) {
                    bubble.remove();
                }
            }, 170);
        }, UI.nameBubbleDuration);
}

function applyMaskedNamesToCharacters() {
    const groomCharacters = Array.from(
        document.querySelectorAll(
            '#groomGuestLayer > .pixel-char'
        )
    );

    const brideCharacters = Array.from(
        document.querySelectorAll(
            '#brideGuestLayer > .pixel-char'
        )
    );

    groomCharacters.forEach(
        (character, index) => {
            const maskedName =
                PUBLIC_NAME_STATE.groom[index] || '';

            if (maskedName) {
                character.dataset.maskedName =
                    maskedName;
            } else {
                delete character.dataset.maskedName;
            }
        }
    );

    brideCharacters.forEach(
        (character, index) => {
            const maskedName =
                PUBLIC_NAME_STATE.bride[index] || '';

            if (maskedName) {
                character.dataset.maskedName =
                    maskedName;
            } else {
                delete character.dataset.maskedName;
            }
        }
    );
}

function setupGuestClickDelegation() {
    if (
        document.documentElement.dataset
            .guestNameClickBound === 'true'
    ) {
        return;
    }

    document.documentElement.dataset
        .guestNameClickBound = 'true';

    /*
     * 메인 단체사진뿐 아니라 RSVP 팝업에 복제된 장면에서도
     * data-masked-name이 있으면 동일하게 동작.
     */
    document.addEventListener(
        'click',
        (event) => {
            const character =
                event.target.closest(
                    '.pixel-char[data-masked-name]'
                );

            if (!character) return;

            const insideGuestScene =
                character.closest(
                    '#groomGuestLayer, ' +
                    '#brideGuestLayer, ' +
                    '.rsvp-live-scene'
                );

            if (!insideGuestScene) return;

            event.preventDefault();
            event.stopPropagation();

            showGuestNameBubble(character);
        },
        true
    );
}

async function getExistingFirebaseContext() {
    const version = '11.10.0';

    const [
        appModule,
        authModule,
        databaseModule
    ] = await Promise.all([
        import(
            `https://www.gstatic.com/firebasejs/${version}/firebase-app.js`
        ),
        import(
            `https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`
        ),
        import(
            `https://www.gstatic.com/firebasejs/${version}/firebase-database.js`
        )
    ]);

    const apps =
        appModule.getApps();

    if (!apps.length) {
        return null;
    }

    const app =
        apps[0];

    const auth =
        authModule.getAuth(app);

    const database =
        databaseModule.getDatabase(app);

    return {
        appModule,
        authModule,
        databaseModule,
        app,
        auth,
        database
    };
}

async function saveCurrentMaskedName() {
    const attendance =
        document.querySelector(
            'input[name="attendance"]:checked'
        )?.value;

    /*
     * 불참이면 publicGuests 자체가 삭제되므로
     * 이름도 저장할 필요 없음.
     */
    if (attendance !== 'yes') return;

    const name =
        document.getElementById('guestName')
            ?.value
            ?.trim();

    const maskedName =
        maskGuestName(name);

    if (!maskedName) return;

    try {
        let context = null;

        /*
         * 원본 Firebase 초기화/저장이 끝날 시간을 줌.
         */
        for (let retry = 0; retry < 10; retry++) {
            context =
                await getExistingFirebaseContext();

            if (
                context?.auth?.currentUser
            ) {
                break;
            }

            await new Promise(
                (resolve) =>
                    window.setTimeout(
                        resolve,
                        150
                    )
            );
        }

        if (
            !context ||
            !context.auth.currentUser
        ) {
            return;
        }

        const uid =
            context.auth.currentUser.uid;

        await context.databaseModule.update(
            context.databaseModule.ref(
                context.database,
                `publicGuests/${uid}`
            ),
            {
                maskedName
            }
        );

        debugLog(
            'masked name saved',
            maskedName
        );
    } catch (error) {
        console.warn(
            'Masked guest name save failed.',
            error
        );
    }
}

function bindMaskedNameSave() {
    const form =
        document.getElementById('rsvpForm');

    if (
        !form ||
        form.dataset.maskedNameSaveBound ===
            'true'
    ) {
        return false;
    }

    form.dataset.maskedNameSaveBound =
        'true';

    /*
     * 원본 submit handler가 publicGuest를 먼저 저장한 뒤
     * maskedName만 같은 publicGuests/{uid}에 추가한다.
     */
    form.addEventListener(
        'submit',
        () => {
            window.setTimeout(
                saveCurrentMaskedName,
                900
            );
        }
    );

    return true;
}

async function connectPublicMaskedNames() {
    if (PUBLIC_NAME_STATE.connected) {
        return;
    }

    try {
        let context = null;

        for (let retry = 0; retry < 20; retry++) {
            context =
                await getExistingFirebaseContext();

            if (context) break;

            await new Promise(
                (resolve) =>
                    window.setTimeout(
                        resolve,
                        150
                    )
            );
        }

        if (!context) return;

        PUBLIC_NAME_STATE.connected = true;

        const publicRef =
            context.databaseModule.ref(
                context.database,
                'publicGuests'
            );

        context.databaseModule.onValue(
            publicRef,
            (snapshot) => {
                const raw =
                    snapshot.val() || {};

                const guests =
                    Object.entries(raw)
                        .map(([id, guest]) => ({
                            id,
                            ...guest
                        }))
                        .filter(
                            (guest) =>
                                guest &&
                                guest.side &&
                                guest.gender
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.joinedAt || 0
                                ) -
                                Number(
                                    b.joinedAt || 0
                                )
                        );

                PUBLIC_NAME_STATE.groom =
                    guests
                        .filter(
                            (guest) =>
                                guest.side ===
                                'groom'
                        )
                        .map(
                            (guest) =>
                                guest.maskedName ||
                                ''
                        );

                PUBLIC_NAME_STATE.bride =
                    guests
                        .filter(
                            (guest) =>
                                guest.side ===
                                'bride'
                        )
                        .map(
                            (guest) =>
                                guest.maskedName ||
                                ''
                        );

                applyMaskedNamesToCharacters();

                /*
                 * data 속성이 포함된 상태로 팝업 미리보기도 갱신.
                 */
                syncLiveScene();
            }
        );

        debugLog(
            'public masked-name listener connected'
        );
    } catch (error) {
        console.warn(
            'Public masked-name listener failed.',
            error
        );
    }
}

function initializeGuestNameFeature() {
    setupGuestClickDelegation();
    bindMaskedNameSave();
    connectPublicMaskedNames();
}

function waitForGuestLayers() {
    const groomLayer =
        document.getElementById('groomGuestLayer');

    const brideLayer =
        document.getElementById('brideGuestLayer');

    if (!groomLayer || !brideLayer) {
        window.setTimeout(waitForGuestLayers, 100);
        return;
    }

    arrangeAllGuests();

    const observer = new MutationObserver(() => {
        window.requestAnimationFrame(arrangeAllGuests);
    });

    observer.observe(groomLayer, {
        childList: true
    });

    observer.observe(brideLayer, {
        childList: true
    });

    const coupleLayer =
        document.getElementById('coupleLayer');

    if (coupleLayer) {
        observer.observe(coupleLayer, {
            childList: true
        });
    }
}

function patchNameAndPhone() {
    const nameInput = document.getElementById('guestName');
    const phoneInput = document.getElementById('phoneLast4');

    if (!nameInput || !phoneInput) return false;

    const nameGroup = nameInput.closest('.form-group');
    const phoneGroup = phoneInput.closest('.form-group');

    if (!nameGroup || !phoneGroup) return false;

    if (!document.querySelector('.rsvp-name-phone-row')) {
        const row = document.createElement('div');
        row.className = 'rsvp-name-phone-row';

        nameGroup.parentNode.insertBefore(row, nameGroup);
        row.appendChild(nameGroup);
        row.appendChild(phoneGroup);
    }

    const nameLabel = nameGroup.querySelector('.form-label');
    const phoneLabel = phoneGroup.querySelector('.form-label');

    if (nameLabel) {
        nameLabel.innerHTML = '이름<span class="required">*</span>';
    }

    if (phoneLabel) {
        phoneLabel.innerHTML =
            `${TEXT.phoneLabel}<span class="required">*</span>`;
    }

    nameInput.placeholder = '예: 홍길동';
    phoneInput.placeholder = '예: 1234';

    return true;
}


function patchAttendanceGuide() {
    const guideText = TEXT.popupGuide;

    /*
     * 반드시 RSVP 팝업 내부에서만 찾는다.
     */
    const nameInput = document.getElementById('guestName');
    if (!nameInput) return false;

    const modal =
        nameInput.closest('.rsvp-modal') ||
        nameInput.closest('.modal') ||
        nameInput.closest('.popup') ||
        nameInput.closest('[role="dialog"]') ||
        nameInput.closest('.modal-content') ||
        nameInput.closest('.popup-content') ||
        nameInput.parentElement;

    if (!modal) return false;

    /*
     * 팝업 안의 정확한 머리말 "참석 의사를 알려주세요"를 찾는다.
     */
    const headingCandidates = Array.from(
        modal.querySelectorAll('h1, h2, h3, h4, p, div, span')
    );

    const heading = headingCandidates.find((el) => {
        if (el.id === 'rsvpCharacterGuide') return false;

        const text = el.textContent
            .replace(/\s+/g, ' ')
            .trim();

        return (
            text === TEXT.popupTitle ||
            text === TEXT.popupTitle.replace(/\s+/g, '')
        );
    });

    if (!heading) return false;

    /*
     * 머리말이 들어있는 네모 박스(header)를 찾는다.
     * 알려진 header class가 있으면 그걸 우선 사용하고,
     * 없으면 제목의 부모 요소를 머리말 박스로 사용한다.
     */
    const headerBox =
        heading.closest(
            '.rsvp-header, ' +
            '.rsvp-modal-header, ' +
            '.modal-header, ' +
            '.popup-header, ' +
            '.form-header, ' +
            '.rsvp-head'
        ) ||
        heading.parentElement;

    if (!headerBox) return false;

    /*
     * 예전 버전에서 팝업 바깥이나 폼 본문에 잘못 들어간 안내문 제거.
     */
    const oldGuide = document.getElementById('rsvpCharacterGuide');

    if (oldGuide && oldGuide.parentElement !== headerBox) {
        oldGuide.remove();
    }

    let guide = headerBox.querySelector('#rsvpCharacterGuide');

    if (!guide) {
        guide = document.createElement('div');
        guide.id = 'rsvpCharacterGuide';
        guide.className = 'rsvp-character-guide';
        guide.textContent = guideText;
    }

    /*
     * 제목 바로 다음 형제로 넣는다.
     * 따라서 네모 머리말 박스 내부 구조는:
     *
     * 참석 의사를 알려주세요
     * 참석 버튼을 누르면 개인 캐릭터를 생성할 수 있습니다 😄
     */
    if (heading.nextElementSibling !== guide) {
        heading.insertAdjacentElement('afterend', guide);
    }

    return true;
}

function patchGender() {
    const genderInputs = Array.from(
        document.querySelectorAll(
            'input[name="gender"]'
        )
    );

    if (!genderInputs.length) return false;

    const genderGroup =
        genderInputs[0].closest('.form-group');

    if (!genderGroup) return false;

    genderGroup.classList.add('rsvp-gender-group');

    /*
     * 원본 제출 검증에는 gender 값이 필요하다.
     * 선택지는 숨기되, 새 응답은 남/여 중 하나를 임의로 지정하고
     * form.reset() 뒤에도 그 값이 유지되도록 defaultChecked도 설정한다.
     */
    if (!genderInputs.some((input) => input.checked)) {
        const selected =
            genderInputs[
                Math.floor(
                    Math.random() *
                    genderInputs.length
                )
            ];

        genderInputs.forEach((input) => {
            input.defaultChecked =
                input === selected;
        });

        selected.checked = true;
        selected.dispatchEvent(
            new Event('change', {
                bubbles: true
            })
        );
    }

    return true;
}


function patchPopupControls() {
    const nameInput = document.getElementById('guestName');
    if (!nameInput) return false;

    const modal =
        nameInput.closest('.rsvp-modal') ||
        nameInput.closest('.modal') ||
        nameInput.closest('.popup') ||
        nameInput.closest('[role="dialog"]') ||
        nameInput.closest('.modal-content') ||
        nameInput.closest('.popup-content') ||
        nameInput.parentElement;

    if (!modal) return false;

    /*
     * 제목
     */
    const titleCandidates = Array.from(
        modal.querySelectorAll('h1, h2, h3, h4, p, div, span')
    );

    const title = titleCandidates.find((el) => {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        return text === TEXT.popupTitle;
    });

    if (title) {
        title.classList.add('rsvp-v2-title');
    }

    /*
     * 입력칸
     */
    modal.querySelectorAll('input[type="text"], input[type="tel"], input[type="number"]')
        .forEach((input) => {
            input.classList.add('rsvp-v2-input');
        });

    /*
     * 선택지
     */
    modal.querySelectorAll(
        'label, .choice-btn, .option-btn, .radio-option, .choice-option'
    ).forEach((el) => {
        const text = el.textContent.replace(/\s+/g, ' ').trim();

        if (
            text.includes('신랑') ||
            text.includes('신부') ||
            text.includes('참석할게요') ||
            text.includes('참석이 어려워요') ||
            text === '남성' ||
            text === '여성'
        ) {
            el.classList.add('rsvp-v2-option');
        }
    });

    /*
     * 버튼
     */
    modal.querySelectorAll('button').forEach((button) => {
        const text = button.textContent.replace(/\s+/g, ' ').trim();

        if (
            text.includes('참석의사 전달하기') ||
            text.includes('참석 의사 전달하기')
        ) {
            button.classList.add('rsvp-v2-submit');
        }

        if (text.includes('나중에 답할게요')) {
            button.classList.add('rsvp-v2-later');
        }
    });

    debugLog('popup controls patched');
    return true;
}

function findSubmitButton() {
    return (
        document.getElementById('rsvpSubmit') ||
        Array.from(document.querySelectorAll('button')).find((button) => {
            return button.textContent.trim().includes('참석의사 전달하기');
        }) ||
        Array.from(document.querySelectorAll('button')).find((button) => {
            return button.textContent.trim().includes('참석 의사 전달하기');
        })
    );
}

function findPixelScene() {
    return (
        document.querySelector('#pixelGuestsSection .pixel-scene') ||
        document.querySelector('.pixel-section .pixel-scene') ||
        document.querySelector('.pixel-scene')
    );
}

function syncLiveScene() {
    const target =
        document.getElementById('rsvpLiveScene');

    const source = findPixelScene();

    if (!target || !source) return;

    const clone = source.cloneNode(true);

    clone.querySelectorAll('[id]').forEach((el) => {
        el.removeAttribute('id');
    });

    clone.removeAttribute('id');

    clone.querySelectorAll('.is-new').forEach((el) => {
        el.classList.remove('is-new');
    });

    target.replaceChildren(clone);
}

function patchLiveScene() {
    const submitButton = findSubmitButton();

    if (!submitButton) return false;

    if (!document.getElementById('rsvpLiveSceneWrap')) {
        const wrap = document.createElement('div');
        wrap.id = 'rsvpLiveSceneWrap';
        wrap.className = 'rsvp-live-scene-wrap';

        wrap.innerHTML = `
            <div class="rsvp-live-scene-title">
                ${TEXT.previewTitle}
            </div>
            <div
                id="rsvpLiveScene"
                class="rsvp-live-scene"
                aria-hidden="true"
            ></div>
        `;

        submitButton.insertAdjacentElement('afterend', wrap);
    }

    syncLiveScene();
    return true;
}

function findElementContainingText(text) {
    const candidates = Array.from(
        document.querySelectorAll('p, div, span')
    );

    return candidates.find((el) => {
        if (el.children.length > 0) return false;
        return el.textContent.trim().includes(text);
    }) || null;
}

function patchBottomMessage() {
    const messageText = TEXT.bottomNote;

    const privacyKeywords = [
        '공개되지 않습니다',
        '신랑, 신부 외에는 공개되지 않습니다',
        '신랑 신부 외에는 공개되지 않습니다'
    ];

    /*
     * 기존 위쪽 안내문은 위치 이동에 의존하지 않고 아예 숨긴다.
     * 원본 DOM 구조나 생성 시점이 달라도 확실히 위에서 사라지게 한다.
     */
    const allElements = Array.from(
        document.querySelectorAll('p, div, span')
    );

    allElements.forEach((el) => {
        if (
            el.children.length === 0 &&
            el.textContent.trim() === messageText &&
            el.id !== 'rsvpBottomMovedMessage'
        ) {
            el.style.setProperty('display', 'none', 'important');
        }
    });

    let privacyEl = null;

    for (const keyword of privacyKeywords) {
        privacyEl = findElementContainingText(keyword);
        if (privacyEl) break;
    }

    if (!privacyEl) return false;

    /*
     * 아래쪽에는 새 안내문을 직접 생성해서 개인정보 문구 바로 위에 넣는다.
     * 이렇게 하면 기존 안내문을 실제로 이동시키지 못하는 경우에도
     * 원하는 위치가 항상 보장된다.
     */
    let bottomMessage =
        document.getElementById('rsvpBottomMovedMessage');

    if (!bottomMessage) {
        bottomMessage = document.createElement('div');
        bottomMessage.id = 'rsvpBottomMovedMessage';
        bottomMessage.className = 'rsvp-bottom-note';
        bottomMessage.textContent = messageText;
    }

    if (bottomMessage.parentNode !== privacyEl.parentNode) {
        privacyEl.parentNode.insertBefore(bottomMessage, privacyEl);
    } else if (bottomMessage.nextSibling !== privacyEl) {
        privacyEl.parentNode.insertBefore(bottomMessage, privacyEl);
    }

    return true;
}

function patchRsvpForm() {
    const namePhoneDone = patchNameAndPhone();
    const controlsDone = patchPopupControls();
    const attendanceGuideDone = patchAttendanceGuide();
    const genderDone = patchGender();
    const liveSceneDone = patchLiveScene();
    const bottomMessageDone = patchBottomMessage();

    return (
        namePhoneDone &&
        controlsDone &&
        attendanceGuideDone &&
        genderDone &&
        liveSceneDone &&
        bottomMessageDone
    );
}


function findStoryButton() {
    const buttons = Array.from(
        document.querySelectorAll('button, a, [role="button"]')
    );

    return buttons.find((element) => {
        const text = element.textContent
            .replace(/\s+/g, ' ')
            .trim();

        return (
            text.includes('진아') &&
            text.includes('형민') &&
            text.includes('스토리 보러가기')
        );
    }) || null;
}

let storyGuideTimer = null;

function showStoryGuide() {
    const storyButton = findStoryButton();

    /*
     * RSVP 팝업이 닫힌 뒤 메인 페이지 최상단으로 이동.
     */
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    let guide =
        document.getElementById('rsvpStoryGuide');

    if (!guide) {
        guide = document.createElement('div');
        guide.id = 'rsvpStoryGuide';
        guide.className = 'rsvp-story-guide';
        guide.textContent =
            '참석 의사를 알려주셔서 감사합니다 💌  진아 · 형민의 결혼 스토리도 구경해보세요!';
        document.body.appendChild(guide);
    }

    if (storyGuideTimer) {
        clearTimeout(storyGuideTimer);
    }

    window.setTimeout(() => {
        guide.classList.add('is-visible');

        if (storyButton) {
            storyButton.classList.add(
                'story-button-rsvp-focus'
            );
        }
    }, 450);

    storyGuideTimer =
        window.setTimeout(() => {
            guide.classList.remove('is-visible');

            if (storyButton) {
                storyButton.classList.remove(
                    'story-button-rsvp-focus'
                );
            }
        }, 4300);
}

function bindPostSubmitStoryGuide() {
    const form =
        document.getElementById('rsvpForm');

    if (
        !form ||
        form.dataset.storyGuideBound === 'true'
    ) {
        return false;
    }

    form.dataset.storyGuideBound = 'true';

    form.addEventListener(
        'submit',
        () => {
            const attendance =
                document.querySelector(
                    'input[name="attendance"]:checked'
                )?.value;

            /*
             * 참석/불참 모두 '참석 의사 전달하기'를 완료한 뒤
             * 스토리 버튼을 보도록 유도.
             *
             * 원본 Firebase 저장 및 팝업 종료 시간을 고려해
             * 1.5초 뒤 실행한다.
             */
            if (attendance) {
                window.setTimeout(
                    showStoryGuide,
                    1500
                );
            }
        }
    );

    return true;
}

function waitForRsvpForm() {
    const patched =
        patchRsvpForm();

    bindMaskedNameSave();
    bindPostSubmitStoryGuide();

    if (patched) return;

    window.setTimeout(
        waitForRsvpForm,
        100
    );
}

async function initialize() {
    addRequestedLayoutStyle();
    addRequestedFormStyle();

    try {
        await loadOriginalScript();
        debugLog('original RSVP loaded');
        waitForGuestLayers();
        waitForRsvpForm();
        initializeGuestNameFeature();
    } catch (error) {
        console.error(
            'RSVP addon original script could not be loaded.',
            error
        );
    }
}

initialize();
    // 하단 검은 토스트 제거
(function () {
    const observer = new MutationObserver(() => {
        document.querySelectorAll(
            '.toast, .toast-message, .snackbar, .MuiSnackbar-root'
        ).forEach(el => {
            el.remove();
        });

        document.querySelectorAll('div').forEach(el => {
            const text = (el.textContent || '').trim();

            if (
                text === '참석의사가 전달되었습니다.' ||
                text === '참석 의사가 전달되었습니다.' ||
                text === '참석의사가 전달되었습니다' ||
                text === '참석 의사가 전달되었습니다'
            ) {
                const style = getComputedStyle(el);

                if (
                    style.position === 'fixed' ||
                    style.position === 'absolute'
                ) {
                    el.remove();
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
})();
