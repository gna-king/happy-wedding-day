(function () {
'use strict';

/*
 * Drop-in rsvp-addon.js
 *
 * Original source is pinned to commit:
 * 94966407f843a8951c35d98dd19d168faf33a5ab
 *
 * Changes:
 * - Smart Crowd: automatic scale/row compression for large guest counts.
 * - Overflow: overloaded side uses empty positions on the opposite side.
 * - Firebase/original side data is never changed by overflow.
 * - whoiscoming.PNG is used by the pinned original.
 * - Bride and groom are placed closer together.
 * - Guests fill rows in the requested order.
 * - Name and phone last 4 digits are placed on one row.
 * - Phone label is shortened to "전화번호 뒷4자리".
 * - The gender question is shown again.
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
 * Wedding RSVP FINAL 1.0 - Character + Smart Crowd + Names + Timelapse + Photo
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
    bottomNoteSize: 12      // 하단 안내문
};

const LAYOUT = {
    coupleGap: -24,         // 더 음수일수록 신랑/신부가 가까워짐
    coupleScale: 0.66,      // 신랑/신부 크기
    coupleBottom: 7,        // 신랑/신부 세로 위치(%)

    firstGuestDistance: 12.5,
    guestGap: 6.4,
    rowGap: 12.5,
    rowInset: 1.8
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

const CROWD = {
    /*
     * 한쪽에 우선적으로 유지할 인원.
     * 이 수를 넘으면 반대쪽에 빈 자리가 있을 때 화면상으로만 넘김.
     */
    preferredSideCapacity: 60,

    /*
     * 한 줄에 배치되는 최대 하객 수.
     * 현재 배치 알고리즘은 한쪽 기준 6명/줄.
     */
    guestsPerRow: 6,

    /*
     * 세로로 사용할 수 있는 범위(%).
     * 신랑/신부 바로 뒤 7%부터 약 88%까지 사용.
     */
    maxBackPosition: 88,

    /*
     * 사람이 많아질수록 자동 축소.
     */
    normalUntil: 30,
    compactUntil: 60,

    normalScaleMultiplier: 1.00,
    compactScaleMultiplier: 0.90,
    denseScaleMultiplier: 0.80,

    /*
     * 캐릭터가 너무 작아지지 않도록 최소값.
     */
    minimumCharacterScale: 0.38,

    /*
     * 반대편 빈자리 활용
     */
    overflowToOtherSide: true
};

const INTERACTION = {
    nameBubbleDuration: 1500,  // 이름 말풍선 표시 시간(ms)
    timelapseMaxDuration: 5200,
    timelapseMinStep: 45,
    timelapseMaxStep: 180
};

const PHOTO = {
    fileName: 'jina-hyungmin-pixel-wedding.png',
    scale: 3
};


const TEXT = {
    popupTitle: '참석 의사를 알려주세요',
    popupGuide: '참석 버튼을 누르면 개인 캐릭터를 생성할 수 있습니다 😄',
    genderQuestion: '성별을 알려주세요',
    phoneLabel: '전화번호 뒷4자리',
    previewTitle: '함께하고 있는 하객들',
    bottomNote: '남겨주신 답변은 예식 준비에 소중히 사용하겠습니다.'
};

const DEBUG = false;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[Wedding RSVP]', ...args);
    }
}

function loadOriginalScript() {
    return new Promise((resolve, reject) => {
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
        script.src = ORIGINAL_SCRIPT_URL;
        script.async = false;
        script.dataset.rsvpOriginal = ORIGINAL_SCRIPT_URL;

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

        /* =====================================================
           FINAL EDITION - 캐릭터 터치 / 타임랩스 / 사진
        ====================================================== */
        .side-guests .pixel-char {
            pointer-events: auto !important;
            cursor: pointer !important;
            touch-action: manipulation !important;
        }

        .guest-name-bubble {
            position: absolute !important;
            z-index: 500 !important;
            transform: translate(-50%, -100%) scale(.92);
            padding: 6px 9px !important;
            min-width: 42px !important;
            background: rgba(255, 253, 249, .97) !important;
            border: 2px solid #5d544d !important;
            box-shadow: 2px 2px 0 rgba(0,0,0,.18) !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: 11px !important;
            line-height: 1 !important;
            color: #4d4540 !important;
            text-align: center !important;
            white-space: nowrap !important;
            pointer-events: none !important;
            opacity: 0;
            transition: opacity .15s ease, transform .15s ease;
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

        .pixel-memory-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-top: 12px !important;
        }

        .pixel-memory-btn {
            min-height: 42px !important;
            padding: 8px 7px !important;
            border: 2px solid #5f5751 !important;
            background: #fff !important;
            color: #514944 !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: 11px !important;
            box-shadow: 3px 3px 0 #bcb2aa !important;
            cursor: pointer !important;
        }

        .pixel-memory-btn:active {
            transform: translate(2px, 2px);
            box-shadow: 1px 1px 0 #bcb2aa !important;
        }

        .pixel-memory-btn:disabled {
            opacity: .45;
            cursor: default !important;
        }

        .pixel-photo-flash {
            position: absolute !important;
            inset: 0 !important;
            z-index: 600 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: rgba(255,255,255,.88) !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: 20px !important;
            color: #49413c !important;
            pointer-events: none !important;
            opacity: 0;
            transition: opacity .18s ease;
        }

        .pixel-photo-flash.is-visible {
            opacity: 1;
        }

        .pixel-char.timelapse-hidden {
            opacity: 0 !important;
        }

        .pixel-char.timelapse-show {
            animation: final-guest-arrive .34s cubic-bezier(.2,.75,.2,1.15);
        }

        @keyframes final-guest-arrive {
            from {
                opacity: 0;
                filter: drop-shadow(1px 1px 0 rgba(0,0,0,.16));
            }
            to {
                opacity: 1;
            }
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
            grid-template-columns: minmax(0, 1.18fr) minmax(0, .82fr) !important;
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

        /* 성별 질문 다시 표시 + 윗 항목과 간격 */
        .rsvp-gender-group > .form-label,
        .rsvp-gender-group > label.form-label {
            display: block !important;
            font-size: ${UI.questionSize}px !important;
            line-height: 1.45 !important;
            margin-bottom: 9px !important;
        }

        .rsvp-gender-group {
            margin-top: 22px !important;
        }

        .rsvp-gender-group .choice-row,
        .rsvp-gender-group .option-row,
        .rsvp-gender-group .radio-row,
        .rsvp-gender-group > div {
            margin-top: 0 !important;
        }

        /* 제출 버튼 아래 현재 참여 캐릭터 장면 */
        .rsvp-live-scene-wrap {
            margin-top: 18px !important;
            padding-top: 16px !important;
            border-top: 2px dashed #d8d0c8 !important;
        }

        .rsvp-live-scene-title {
            margin-bottom: 10px !important;
            text-align: center !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: ${UI.previewTitleSize}px !important;
            color: #756c65 !important;
        }

        .rsvp-live-scene {
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
 * One-side seating order:
 *
 * 1~4   : row 1, closest to the couple first
 * 5~8   : row 2, from the center outward
 * 9~12  : row 3, from the center outward
 * 13~14 : add two seats to row 1
 * 15~16 : add two seats to row 2
 * 17~18 : add two seats to row 3
 *
 * When rows 1~3 are complete, rows 4~6 start
 * with the same pattern.
 */
function createSeatOrder(count) {
    const seats = [];

    const rowsPerGroup = 3;
    const initialGuestsPerRow = 4;
    const extraGuestsPerRow = 2;

    let groupStartRow = 0;

    while (seats.length < count) {
        for (
            let rowOffset = 0;
            rowOffset < rowsPerGroup && seats.length < count;
            rowOffset++
        ) {
            for (
                let position = 0;
                position < initialGuestsPerRow &&
                seats.length < count;
                position++
            ) {
                seats.push({
                    row: groupStartRow + rowOffset,
                    position
                });
            }
        }

        for (
            let rowOffset = 0;
            rowOffset < rowsPerGroup && seats.length < count;
            rowOffset++
        ) {
            for (
                let extra = 0;
                extra < extraGuestsPerRow &&
                seats.length < count;
                extra++
            ) {
                seats.push({
                    row: groupStartRow + rowOffset,
                    position: initialGuestsPerRow + extra
                });
            }
        }

        groupStartRow += rowsPerGroup;
    }

    return seats;
}

function getSeatStyle(seat, side) {
    const firstDistance = LAYOUT.firstGuestDistance;
    const horizontalStep = LAYOUT.guestGap;
    const distance =
        firstDistance + seat.position * horizontalStep;

    const bottom = LAYOUT.coupleBottom + seat.row * LAYOUT.rowGap;

    const rowInset = Math.min(
        seat.row * LAYOUT.rowInset,
        9
    );

    const left = side === 'groom'
        ? 50 - distance + rowInset
        : 50 + distance - rowInset;

    const scale = Math.max(
        0.46,
        0.64 - seat.row * 0.025
    );

    return {
        left,
        bottom,
        scale,
        zIndex: 80 - seat.row
    };
}

function getCrowdMetrics(count) {
    const rows = Math.max(
        1,
        Math.ceil(count / CROWD.guestsPerRow)
    );

    let scaleMultiplier = CROWD.normalScaleMultiplier;

    if (count > CROWD.compactUntil) {
        scaleMultiplier = CROWD.denseScaleMultiplier;
    } else if (count > CROWD.normalUntil) {
        /*
         * 30~60명 사이에서는 갑자기 작아지지 않고
         * 자연스럽게 1.00 -> 0.90으로 감소.
         */
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

    /*
     * 줄이 많아질 경우 화면 위를 벗어나지 않도록
     * rowGap을 자동으로 줄인다.
     */
    let rowGap = LAYOUT.rowGap;

    if (rows > 1) {
        const availableHeight =
            CROWD.maxBackPosition - LAYOUT.coupleBottom;

        rowGap = Math.min(
            LAYOUT.rowGap,
            availableHeight / (rows - 1)
        );
    }

    /*
     * 사람이 많아질수록 가로 간격도 아주 조금 압축.
     */
    let guestGap = LAYOUT.guestGap;

    if (count > CROWD.compactUntil) {
        guestGap = LAYOUT.guestGap * 0.88;
    } else if (count > CROWD.normalUntil) {
        guestGap = LAYOUT.guestGap * 0.94;
    }

    return {
        rows,
        rowGap,
        guestGap,
        scaleMultiplier
    };
}

function getAdaptiveSeatStyle(
    seat,
    visualSide,
    metrics
) {
    const distance =
        LAYOUT.firstGuestDistance +
        seat.position * metrics.guestGap;

    const bottom =
        LAYOUT.coupleBottom +
        seat.row * metrics.rowGap;

    const rowInset = Math.min(
        seat.row * LAYOUT.rowInset,
        9
    );

    const left = visualSide === 'groom'
        ? 50 - distance + rowInset
        : 50 + distance - rowInset;

    /*
     * 기존 원근감(scale 감소)은 유지하면서
     * 전체 인원에 따른 추가 축소를 적용.
     */
    const baseScale = Math.max(
        0.46,
        0.64 - seat.row * 0.025
    );

    const scale = Math.max(
        CROWD.minimumCharacterScale,
        baseScale * metrics.scaleMultiplier
    );

    return {
        left,
        bottom,
        scale,
        zIndex: 80 - seat.row
    };
}

function applyGuestPosition(
    guest,
    seat,
    visualSide,
    metrics
) {
    const style = getAdaptiveSeatStyle(
        seat,
        visualSide,
        metrics
    );

    guest.classList.remove('back');

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

    /*
     * 실제 소속이 아니라 현재 화면상 배치 위치.
     * Firebase 데이터는 건드리지 않는다.
     */
    guest.dataset.visualSide = visualSide;
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
     * 신부측 초과 인원을 신랑측 빈자리로 화면상 이동.
     */
    if (
        brideVisual.length > capacity &&
        groomVisual.length < capacity
    ) {
        const available =
            capacity - groomVisual.length;

        const excess =
            brideVisual.length - capacity;

        const moveCount =
            Math.min(available, excess);

        const moved =
            brideVisual.splice(
                brideVisual.length - moveCount,
                moveCount
            );

        groomVisual.push(...moved);
    }

    /*
     * 반대 상황도 동일하게 처리.
     */
    if (
        groomVisual.length > capacity &&
        brideVisual.length < capacity
    ) {
        const available =
            capacity - brideVisual.length;

        const excess =
            groomVisual.length - capacity;

        const moveCount =
            Math.min(available, excess);

        const moved =
            groomVisual.splice(
                groomVisual.length - moveCount,
                moveCount
            );

        brideVisual.push(...moved);
    }

    return {
        groomVisual,
        brideVisual
    };
}

function arrangeVisualSide(
    guests,
    visualSide
) {
    const seats =
        createSeatOrder(guests.length);

    const metrics =
        getCrowdMetrics(guests.length);

    guests.forEach((guest, index) => {
        applyGuestPosition(
            guest,
            seats[index],
            visualSide,
            metrics
        );
    });
}

function arrangeAllGuests() {
    const groomLayer =
        document.getElementById('groomGuestLayer');

    const brideLayer =
        document.getElementById('brideGuestLayer');

    if (!groomLayer || !brideLayer) return;

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
     * 실제 DOM/Firebase 소속은 그대로 둔 채
     * 화면상 배치 리스트만 재구성.
     */
    const {
        groomVisual,
        brideVisual
    } = buildVisualGuestLists(
        groomGuests,
        brideGuests
    );

    arrangeVisualSide(
        groomVisual,
        'groom'
    );

    arrangeVisualSide(
        brideVisual,
        'bride'
    );

    /*
     * 리본은 실제 소속 기준으로 적용.
     * 따라서 overflow 되어 반대편에 서도 색은 그대로 유지.
     */
    decorateWeddingCharacters();
    bindGuestNameClicks();

    debugLog(
        'crowd layout',
        {
            realGroom: groomGuests.length,
            realBride: brideGuests.length,
            visualGroom: groomVisual.length,
            visualBride: brideVisual.length
        }
    );

    syncLiveScene();
}


/* ============================================================
   FINAL EDITION - 개인정보 보호 이름
============================================================ */
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

let guestNameData = {
    groom: [],
    bride: []
};

let guestNameBubbleTimer = null;

function removeGuestNameBubble() {
    const bubble =
        document.getElementById('guestNameBubble');

    if (bubble) bubble.remove();

    if (guestNameBubbleTimer) {
        clearTimeout(guestNameBubbleTimer);
        guestNameBubbleTimer = null;
    }
}

function showGuestNameBubble(character) {
    const maskedName =
        character?.dataset?.maskedName || '';

    if (!maskedName) return;

    const scene =
        document.querySelector('.pixel-scene');

    if (!scene) return;

    removeGuestNameBubble();

    const sceneRect =
        scene.getBoundingClientRect();

    const charRect =
        character.getBoundingClientRect();

    const bubble =
        document.createElement('div');

    bubble.id = 'guestNameBubble';
    bubble.className = 'guest-name-bubble';
    bubble.textContent = maskedName;

    /*
     * 캐릭터 중심의 바로 위에 배치.
     */
    const centerX =
        charRect.left -
        sceneRect.left +
        charRect.width / 2;

    const topY =
        charRect.top -
        sceneRect.top -
        3;

    bubble.style.left = `${centerX}px`;
    bubble.style.top = `${topY}px`;

    scene.appendChild(bubble);

    requestAnimationFrame(() => {
        bubble.classList.add('is-visible');
    });

    guestNameBubbleTimer =
        setTimeout(() => {
            bubble.classList.remove('is-visible');

            setTimeout(() => {
                if (bubble.isConnected) {
                    bubble.remove();
                }
            }, 180);
        }, INTERACTION.nameBubbleDuration);
}

function bindGuestNameClicks() {
    const groomLayer =
        document.getElementById('groomGuestLayer');

    const brideLayer =
        document.getElementById('brideGuestLayer');

    if (!groomLayer || !brideLayer) return;

    const groomCharacters = Array.from(
        groomLayer.querySelectorAll(
            ':scope > .pixel-char'
        )
    );

    const brideCharacters = Array.from(
        brideLayer.querySelectorAll(
            ':scope > .pixel-char'
        )
    );

    groomCharacters.forEach((character, index) => {
        const guest =
            guestNameData.groom[index];

        const maskedName =
            guest?.maskedName || '';

        character.dataset.maskedName =
            maskedName;

        character.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            showGuestNameBubble(character);
        };
    });

    brideCharacters.forEach((character, index) => {
        const guest =
            guestNameData.bride[index];

        const maskedName =
            guest?.maskedName || '';

        character.dataset.maskedName =
            maskedName;

        character.onclick = (event) => {
            event.preventDefault();
            event.stopPropagation();
            showGuestNameBubble(character);
        };
    });
}

/*
 * Firebase publicGuests를 별도로 읽어서,
 * 화면상의 캐릭터 순서와 이름만 연결한다.
 *
 * 이름 원문은 publicGuests에 저장하지 않고
 * maskedName만 저장한다.
 */
async function connectPublicGuestNames() {
    const config =
        window.WEDDING_FIREBASE_CONFIG;

    if (!config) return;

    try {
        const version = '11.10.0';

        const [
            appModule,
            databaseModule
        ] = await Promise.all([
            import(
                `https://www.gstatic.com/firebasejs/${version}/firebase-app.js`
            ),
            import(
                `https://www.gstatic.com/firebasejs/${version}/firebase-database.js`
            )
        ]);

        const apps = appModule.getApps();

        if (!apps.length) {
            window.setTimeout(
                connectPublicGuestNames,
                500
            );
            return;
        }

        const app = apps[0];
        const database =
            databaseModule.getDatabase(app);

        const publicRef =
            databaseModule.ref(
                database,
                'publicGuests'
            );

        databaseModule.onValue(
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
                                Number(a.joinedAt || 0) -
                                Number(b.joinedAt || 0)
                        );

                guestNameData.groom =
                    guests.filter(
                        (guest) =>
                            guest.side === 'groom'
                    );

                guestNameData.bride =
                    guests.filter(
                        (guest) =>
                            guest.side === 'bride'
                    );

                window.requestAnimationFrame(() => {
                    bindGuestNameClicks();
                });
            }
        );

        debugLog(
            'public guest name listener connected'
        );
    } catch (error) {
        console.warn(
            'Guest name listener could not start.',
            error
        );
    }
}

/*
 * 참석 폼 제출 후, 공개 DB에는 원래 이름이 아니라
 * 마스킹된 이름만 추가한다.
 *
 * 기존에 이미 등록된 하객은 다시 한 번 RSVP를 수정/저장하면
 * maskedName이 추가된다.
 */
async function saveMaskedNameForCurrentGuest() {
    const nameInput =
        document.getElementById('guestName');

    const attendance =
        document.querySelector(
            'input[name="attendance"]:checked'
        )?.value;

    if (
        !nameInput ||
        attendance !== 'yes'
    ) {
        return;
    }

    const maskedName =
        maskGuestName(nameInput.value);

    if (!maskedName) return;

    try {
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

        if (!apps.length) return;

        const app =
            apps[0];

        const auth =
            authModule.getAuth(app);

        const user =
            auth.currentUser;

        if (!user) return;

        const database =
            databaseModule.getDatabase(app);

        await databaseModule.update(
            databaseModule.ref(
                database,
                `publicGuests/${user.uid}`
            ),
            {
                maskedName
            }
        );

        debugLog(
            'masked guest name saved',
            maskedName
        );
    } catch (error) {
        console.warn(
            'Masked name could not be saved.',
            error
        );
    }
}

function bindMaskedNameSave() {
    const form =
        document.getElementById('rsvpForm');

    if (
        !form ||
        form.dataset.maskedNameBound === 'true'
    ) {
        return;
    }

    form.dataset.maskedNameBound = 'true';

    /*
     * 원본 RSVP 저장이 먼저 끝나도록 약간 뒤에 실행.
     */
    form.addEventListener(
        'submit',
        () => {
            window.setTimeout(
                saveMaskedNameForCurrentGuest,
                1200
            );
        }
    );
}

/* ============================================================
   FINAL EDITION - 타임랩스
============================================================ */
let timelapseRunning = false;

function getAllGuestCharacters() {
    return [
        ...document.querySelectorAll(
            '#groomGuestLayer > .pixel-char'
        ),
        ...document.querySelectorAll(
            '#brideGuestLayer > .pixel-char'
        )
    ];
}

function sleep(ms) {
    return new Promise(
        (resolve) => setTimeout(resolve, ms)
    );
}

function showPhotoFlash(text = '📸 찰칵!') {
    const scene =
        document.querySelector('.pixel-scene');

    if (!scene) return;

    let flash =
        document.getElementById(
            'pixelPhotoFlash'
        );

    if (!flash) {
        flash =
            document.createElement('div');

        flash.id = 'pixelPhotoFlash';
        flash.className =
            'pixel-photo-flash';

        scene.appendChild(flash);
    }

    flash.textContent = text;

    requestAnimationFrame(() => {
        flash.classList.add('is-visible');
    });

    window.setTimeout(() => {
        flash.classList.remove('is-visible');
    }, 350);
}

async function playGuestTimelapse() {
    if (timelapseRunning) return;

    const characters =
        getAllGuestCharacters();

    if (!characters.length) {
        showPhotoFlash('아직 하객이 없어요!');
        return;
    }

    timelapseRunning = true;
    removeGuestNameBubble();

    const button =
        document.getElementById(
            'pixelTimelapseBtn'
        );

    if (button) {
        button.disabled = true;
        button.textContent = '하객들이 모이는 중...';
    }

    const countEl =
        document.getElementById(
            'guestCount'
        );

    const originalCount =
        countEl?.textContent || '';

    characters.forEach((character) => {
        character.classList.add(
            'timelapse-hidden'
        );
        character.classList.remove(
            'timelapse-show'
        );
    });

    if (countEl) {
        countEl.textContent = '0';
    }

    /*
     * 인원이 많아져도 전체 재생 시간이 너무 길어지지 않도록
     * 인원 수에 따라 자동으로 간격 계산.
     */
    const step = Math.max(
        INTERACTION.timelapseMinStep,
        Math.min(
            INTERACTION.timelapseMaxStep,
            Math.floor(
                INTERACTION.timelapseMaxDuration /
                characters.length
            )
        )
    );

    for (
        let index = 0;
        index < characters.length;
        index++
    ) {
        const character =
            characters[index];

        character.classList.remove(
            'timelapse-hidden'
        );

        character.classList.remove(
            'timelapse-show'
        );

        void character.offsetWidth;

        character.classList.add(
            'timelapse-show'
        );

        if (countEl) {
            countEl.textContent =
                String(index + 1);
        }

        await sleep(step);
    }

    await sleep(280);
    showPhotoFlash('📸 찰칵!');

    await sleep(430);

    characters.forEach((character) => {
        character.classList.remove(
            'timelapse-hidden',
            'timelapse-show'
        );
    });

    if (countEl) {
        countEl.textContent =
            originalCount ||
            String(characters.length);
    }

    if (button) {
        button.disabled = false;
        button.textContent =
            '▶ 하객 타임랩스';
    }

    timelapseRunning = false;
}

/* ============================================================
   FINAL EDITION - 단체사진 PNG 저장
============================================================ */
function loadHtml2Canvas() {
    return new Promise(
        (resolve, reject) => {
            if (window.html2canvas) {
                resolve(window.html2canvas);
                return;
            }

            const existing =
                document.querySelector(
                    'script[data-html2canvas="true"]'
                );

            if (existing) {
                existing.addEventListener(
                    'load',
                    () => resolve(
                        window.html2canvas
                    ),
                    { once: true }
                );

                existing.addEventListener(
                    'error',
                    reject,
                    { once: true }
                );

                return;
            }

            const script =
                document.createElement(
                    'script'
                );

            script.src =
                'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

            script.dataset.html2canvas =
                'true';

            script.onload = () =>
                resolve(window.html2canvas);

            script.onerror = reject;

            document.head.appendChild(
                script
            );
        }
    );
}

async function saveGroupPhoto() {
    if (timelapseRunning) return;

    const scene =
        document.querySelector(
            '.pixel-scene'
        );

    if (!scene) return;

    const button =
        document.getElementById(
            'pixelSavePhotoBtn'
        );

    if (button) {
        button.disabled = true;
        button.textContent = '사진 만드는 중...';
    }

    removeGuestNameBubble();

    try {
        const html2canvas =
            await loadHtml2Canvas();

        const canvas =
            await html2canvas(
                scene,
                {
                    scale: PHOTO.scale,
                    backgroundColor: null,
                    useCORS: true,
                    logging: false
                }
            );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    throw new Error(
                        'PNG blob creation failed'
                    );
                }

                const url =
                    URL.createObjectURL(blob);

                const link =
                    document.createElement('a');

                link.href = url;
                link.download =
                    PHOTO.fileName;

                document.body.appendChild(
                    link
                );

                link.click();
                link.remove();

                window.setTimeout(
                    () =>
                        URL.revokeObjectURL(
                            url
                        ),
                    1500
                );

                showPhotoFlash(
                    '📸 사진 완성!'
                );
            },
            'image/png'
        );
    } catch (error) {
        console.error(
            'Group photo save failed.',
            error
        );

        showPhotoFlash(
            '사진 저장에 실패했어요'
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                '📷 단체사진 저장';
        }
    }
}

function addMemoryActions() {
    if (
        document.getElementById(
            'pixelMemoryActions'
        )
    ) {
        return;
    }

    const section =
        document.getElementById(
            'pixelGuestsSection'
        );

    const originalActions =
        section?.querySelector(
            '.rsvp-bottom-actions'
        );

    if (
        !section ||
        !originalActions
    ) {
        return;
    }

    const wrap =
        document.createElement('div');

    wrap.id = 'pixelMemoryActions';
    wrap.className =
        'pixel-memory-actions';

    const timelapseButton =
        document.createElement(
            'button'
        );

    timelapseButton.id =
        'pixelTimelapseBtn';

    timelapseButton.type =
        'button';

    timelapseButton.className =
        'pixel-memory-btn';

    timelapseButton.textContent =
        '▶ 하객 타임랩스';

    timelapseButton.onclick =
        playGuestTimelapse;

    const photoButton =
        document.createElement(
            'button'
        );

    photoButton.id =
        'pixelSavePhotoBtn';

    photoButton.type =
        'button';

    photoButton.className =
        'pixel-memory-btn';

    photoButton.textContent =
        '📷 단체사진 저장';

    photoButton.onclick =
        saveGroupPhoto;

    wrap.append(
        timelapseButton,
        photoButton
    );

    originalActions.insertAdjacentElement(
        'beforebegin',
        wrap
    );
}

function initializeFinalEditionFeatures() {
    addMemoryActions();
    bindMaskedNameSave();
    connectPublicGuestNames();

    /*
     * 원본이 하객 DOM을 새로 그릴 때마다 클릭 연결을 다시 설정.
     */
    const groomLayer =
        document.getElementById(
            'groomGuestLayer'
        );

    const brideLayer =
        document.getElementById(
            'brideGuestLayer'
        );

    if (!groomLayer || !brideLayer) {
        window.setTimeout(
            initializeFinalEditionFeatures,
            120
        );
        return;
    }

    const clickObserver =
        new MutationObserver(() => {
            window.requestAnimationFrame(
                bindGuestNameClicks
            );
        });

    clickObserver.observe(
        groomLayer,
        { childList: true }
    );

    clickObserver.observe(
        brideLayer,
        { childList: true }
    );

    bindGuestNameClicks();

    debugLog(
        'Final Edition features ready'
    );
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
    const genderInput =
        document.querySelector('input[name="gender"]');

    if (!genderInput) return false;

    const genderGroup =
        genderInput.closest('.form-group');

    if (!genderGroup) return false;

    genderGroup.classList.add('rsvp-gender-group');

    let label = genderGroup.querySelector('.form-label');

    if (!label) {
        label = document.createElement('div');
        label.className = 'form-label';
        genderGroup.insertBefore(label, genderGroup.firstChild);
    }

    label.textContent = TEXT.genderQuestion;

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

function waitForRsvpForm() {
    if (patchRsvpForm()) return;

    window.setTimeout(waitForRsvpForm, 100);
}

async function initialize() {
    addRequestedLayoutStyle();
    addRequestedFormStyle();

    try {
        await loadOriginalScript();
        debugLog('original RSVP loaded');
        waitForGuestLayers();
        waitForRsvpForm();
        initializeFinalEditionFeatures();
    } catch (error) {
        console.error(
            'RSVP addon original script could not be loaded.',
            error
        );
    }
}

initialize();
})();
