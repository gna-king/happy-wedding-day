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
 * Wedding RSVP v2 - 여기만 수정하면 대부분의 디자인 변경 가능
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

function arrangeLayer(layer, side) {
    if (!layer) return;

    const guests = Array.from(
        layer.querySelectorAll(':scope > .pixel-char')
    );

    const seats = createSeatOrder(guests.length);

    guests.forEach((guest, index) => {
        const style = getSeatStyle(
            seats[index],
            side
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
    });
}

function arrangeAllGuests() {
    arrangeLayer(
        document.getElementById('groomGuestLayer'),
        'groom'
    );

    arrangeLayer(
        document.getElementById('brideGuestLayer'),
        'bride'
    );

    syncLiveScene();
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
    } catch (error) {
        console.error(
            'RSVP addon original script could not be loaded.',
            error
        );
    }
}

initialize();
})();
