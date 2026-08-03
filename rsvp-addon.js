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
 */

const ORIGINAL_SCRIPT_URL =
    'https://cdn.jsdelivr.net/gh/gna-king/happy-wedding-day@94966407f843a8951c35d98dd19d168faf33a5ab/rsvp-addon.js';

const LAYOUT_STYLE_ID = 'weddingRsvpRequestedLayoutStyle';

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
            margin-right: -7px !important;
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
        /*
         * First, place four guests in each of the three rows.
         */
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

        /*
         * Then add two guests to each row.
         */
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

        /*
         * Move to the next three rows.
         */
        groupStartRow += rowsPerGroup;
    }

    return seats;
}

function getSeatStyle(seat, side) {
    /*
     * position 0 is closest to the bride or groom.
     */
    const firstDistance = 7.2;
    const horizontalStep = 7;
    const distance =
        firstDistance + seat.position * horizontalStep;

    /*
     * Row 1 stays at the couple's level.
     * Higher rows move upward.
     */
    const bottom = 7 + seat.row * 12.5;

    /*
     * Higher rows move slightly inward.
     */
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

async function initialize() {
    addRequestedLayoutStyle();

    try {
        await loadOriginalScript();
        waitForGuestLayers();
    } catch (error) {
        console.error(
            'RSVP addon original script could not be loaded.',
            error
        );
    }
}

initialize();
})();
