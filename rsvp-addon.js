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
 * - The gender question label is hidden; only the choices remain.
 * - A copy of the currently displayed wedding guest scene is shown
 *   directly below the RSVP submit button.
 */

const ORIGINAL_SCRIPT_URL =
    'https://cdn.jsdelivr.net/gh/gna-king/happy-wedding-day@94966407f843a8951c35d98dd19d168faf33a5ab/rsvp-addon.js';

const LAYOUT_STYLE_ID = 'weddingRsvpRequestedLayoutStyle';
const FORM_STYLE_ID = 'weddingRsvpFormRequestedStyle';

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
            bottom: 7% !important;
            transform: translateX(-50%) !important;
            display: flex !important;
            align-items: flex-end !important;
            gap: 0 !important;
            z-index: 100 !important;
        }

        .couple-layer .pixel-char {
            transform: scale(.66) !important;
            transform-origin: bottom center !important;
        }

        .couple-layer .pixel-char:first-child {
            margin-right: -14px !important;
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
        .rsvp-name-phone-row {
            display: grid !important;
            grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr) !important;
            gap: 10px !important;
            align-items: end !important;
            width: 100% !important;
            margin-bottom: 18px !important;
        }

        .rsvp-name-phone-row .form-group {
            min-width: 0 !important;
            margin-bottom: 0 !important;
        }

        .rsvp-name-phone-row .text-input,
        .rsvp-name-phone-row input {
            width: 100% !important;
            min-width: 0 !important;
        }

        .rsvp-name-phone-row .form-label {
            white-space: nowrap !important;
            font-size: 13px !important;
        }

        .rsvp-gender-group {
            margin-top: 14px !important;
        }

        .rsvp-gender-group > .form-label,
        .rsvp-gender-group > label.form-label {
            display: none !important;
        }

        .rsvp-live-scene-wrap {
            margin-top: 18px !important;
            padding-top: 16px !important;
            border-top: 2px dashed #d8d0c8 !important;
        }

        .rsvp-live-scene-title {
            margin-bottom: 10px !important;
            text-align: center !important;
            font-family: 'DungGeunMo', monospace !important;
            font-size: 12px !important;
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

        @media (max-width: 350px) {
            .rsvp-name-phone-row {
                grid-template-columns: 1fr 1fr !important;
                gap: 7px !important;
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
    const firstDistance = 12.5;
    const horizontalStep = 6.4;
    const distance =
        firstDistance + seat.position * horizontalStep;

    const bottom = 7 + seat.row * 12.5;

    const rowInset = Math.min(
        seat.row * 1.8,
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
        nameLabel.innerHTML = '성함<span class="required">*</span>';
    }

    if (phoneLabel) {
        phoneLabel.innerHTML = '전화번호 뒷4자리<span class="required">*</span>';
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
                함께하고 있는 하객들
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


function moveAnswerUseNotice() {
    const all = Array.from(document.querySelectorAll('p, div, span'));

    const notice = all.find((el) => {
        const text = el.textContent.trim();
        return (
            text === '남겨주신 답변은 예식 준비에 소중히 사용하겠습니다.' ||
            text.includes('남겨주신 답변은 예식 준비에 소중히 사용하겠습니다')
        );
    });

    if (!notice) return false;

    /*
     * Find the privacy notice near the bottom of the RSVP form.
     * Wording may differ slightly in the pinned original, so search
     * using the key words "이름", "전화번호", and "공개".
     */
    const privacy = all.find((el) => {
        const text = el.textContent.trim();
        return (
            text.includes('이름') &&
            text.includes('전화번호') &&
            (
                text.includes('공개') ||
                text.includes('노출') ||
                text.includes('보이지')
            )
        );
    });

    if (!privacy) return false;

    if (notice === privacy || notice.contains(privacy) || privacy.contains(notice)) {
        return false;
    }

    notice.style.marginTop = '24px';
    notice.style.marginBottom = '10px';
    notice.style.textAlign = 'center';

    privacy.parentNode.insertBefore(notice, privacy);
    return true;
}

function patchRsvpForm() {
    const namePhoneDone = patchNameAndPhone();
    const genderDone = patchGender();
    const liveSceneDone = patchLiveScene();
    moveAnswerUseNotice();

    return namePhoneDone && genderDone && liveSceneDone;
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
