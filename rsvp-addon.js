(function () {
'use strict';

const RSVP_STYLE = "/* 픽셀 하객 영역 */\n        .pixel-section {\n            padding: 74px 18px 48px;\n            background: #f4f0eb;\n            text-align: center;\n            border-top: 1px solid #e5ddd5;\n        }\n        .pixel-kicker { font-family: 'DungGeunMo', monospace; color: #8e7e70; font-size: 14px; margin-bottom: 14px; }\n        .pixel-title { font-family: 'Gowun Batang', serif; font-size: 25px; color: #423d39; margin-bottom: 12px; }\n        .pixel-count { font-family: 'DungGeunMo', monospace; margin-bottom: 22px; }\n        .pixel-count strong { color: #b36b68; font-size: 20px; }\n\n        .pixel-scene {\n            width: 100%;\n            aspect-ratio: 16/12;\n            position: relative;\n            overflow: hidden;\n            border: 4px solid #5d544d;\n            background: #b8dcf0;\n            box-shadow: 6px 6px 0 #bcb2aa;\n            image-rendering: pixelated;\n        }\n        .pixel-bg { position: absolute; inset: 0; z-index: 1; }\n        .pixel-bg svg { width: 100%; height: 100%; display: block; shape-rendering: crispEdges; }\n        .pixel-bg img {\n            width: 100%;\n            height: 100%;\n            display: block;\n            object-fit: cover;\n            object-position: center;\n            image-rendering: pixelated;\n        }\n\n        .group-photo-layer { position: absolute; inset: 0; z-index: 3; pointer-events: none; }\n        .couple-layer {\n            position: absolute;\n            left: 50%;\n            bottom: 12%;\n            transform: translateX(-50%);\n            display: flex;\n            gap: 2px;\n            align-items: flex-end;\n            z-index: 5;\n        }\n        .side-guests {\n            position: absolute;\n            bottom: 9%;\n            width: 39%;\n            height: 46%;\n            display: flex;\n            flex-wrap: wrap-reverse;\n            align-content: flex-start;\n            align-items: flex-end;\n            justify-content: center;\n            gap: 1px 0;\n        }\n        .side-guests.left { left: 1%; }\n        .side-guests.right { right: 1%; }\n        .pixel-char {\n            width: 48px;\n            height: 56px;\n            display: inline-block;\n            image-rendering: pixelated;\n            filter: drop-shadow(1px 1px 0 rgba(0,0,0,.16));\n        }\n        .pixel-char svg { width: 100%; height: 100%; display: block; shape-rendering: crispEdges; }\n        .side-guests .pixel-char { transform: scale(.66); transform-origin: bottom center; margin: -1px -3px 0; }\n        .side-guests .pixel-char.back { transform: scale(.58); margin-bottom: 24px; }\n        .couple-layer .pixel-char {\n            transform: scale(.66);\n            transform-origin: bottom center;\n        }\n        .pixel-char.is-new { animation: guest-pop .75s cubic-bezier(.2,.8,.2,1.25); }\n        @keyframes guest-pop {\n            0% { opacity: 0; transform: translateY(-22px) scale(.35); }\n            100% { opacity: 1; }\n        }\n        .pixel-empty {\n            position: absolute;\n            z-index: 7;\n            left: 50%;\n            bottom: 14px;\n            transform: translateX(-50%);\n            width: 88%;\n            padding: 10px;\n            background: rgba(255,253,247,.92);\n            border: 2px solid #6e635b;\n            font-family: 'DungGeunMo', monospace;\n            font-size: 12px;\n            line-height: 1.55;\n        }\n        .pixel-side-labels { display: grid; grid-template-columns: 1fr 1fr; margin-top: 13px; font-family: 'DungGeunMo', monospace; font-size: 12px; }\n        .pixel-side-labels span:first-child { border-right: 1px dashed #cfc6bf; }\n        .rsvp-bottom-actions { margin-top: 24px; }\n        .rsvp-open-btn {\n            border: 2px solid #5f5751;\n            background: #fff;\n            padding: 12px 18px;\n            font-family: 'DungGeunMo', monospace;\n            box-shadow: 3px 3px 0 #bcb2aa;\n            cursor: pointer;\n        }\n        .backend-status { margin-top: 15px; min-height: 16px; font-size: 11px; color: #9a918a; }\n        .pixel-footer { padding: 24px 20px 50px; text-align: center; background: #f2efec; color: #938a83; }\n\n        /* 팝업 */\n        .rsvp-modal {\n            position: fixed;\n            z-index: 12000;\n            inset: 0;\n            display: none;\n            align-items: center;\n            justify-content: center;\n            padding: 18px;\n            background: rgba(38,33,30,.72);\n        }\n        .rsvp-modal.is-open { display: flex; }\n        .rsvp-dialog {\n            width: min(100%,390px);\n            max-height: calc(100vh - 36px);\n            overflow-y: auto;\n            background: #fffdf9;\n            border: 4px solid #4d4540;\n            box-shadow: 8px 8px 0 rgba(0,0,0,.28);\n            position: relative;\n        }\n        .rsvp-dialog-header { padding: 28px 24px 18px; text-align: center; border-bottom: 2px dashed #d5ccc4; background: #f6f0e8; }\n        .rsvp-dialog-kicker { font-family: 'DungGeunMo', monospace; font-size: 12px; color: #aa756e; margin-bottom: 10px; }\n        .rsvp-dialog-title { font-family: 'Gowun Batang', serif; font-size: 23px; margin-bottom: 8px; }\n        .rsvp-dialog-desc { font-size: 13px; color: #77706a; line-height: 1.65; }\n        .rsvp-close-x { position: absolute; top: 8px; right: 10px; border: 0; background: transparent; font-size: 27px; cursor: pointer; }\n        .rsvp-form { padding: 23px 20px 20px; }\n        .form-group { margin-bottom: 22px; }\n        .form-label { display: block; margin-bottom: 10px; font-family: 'Gowun Batang', serif; font-weight: 700; }\n        .required { color: #b75d5a; }\n        .choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n        .choice-item, .mini-choice { position: relative; }\n        .choice-item input, .mini-choice input { position: absolute; opacity: 0; pointer-events: none; }\n        .choice-item span, .mini-choice span {\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            border: 2px solid #d7d0ca;\n            background: #fff;\n            cursor: pointer;\n            text-align: center;\n        }\n        .choice-item span { min-height: 46px; padding: 8px; }\n        .mini-choice span { min-height: 38px; padding: 4px; font-size: 11px; }\n        .choice-item input:checked + span, .mini-choice input:checked + span {\n            border-color: #554c47;\n            box-shadow: inset 0 -3px 0 #d3c5ba;\n            font-weight: 700;\n        }\n        .text-input { width: 100%; height: 48px; border: 2px solid #d7d0ca; padding: 0 13px; }\n        .character-customizer { display: none; padding: 16px 13px; border: 2px dashed #cfc4bb; background: #faf6f0; }\n        .character-customizer.is-visible { display: block; }\n        .customizer-title { font-family: 'DungGeunMo', monospace; text-align: center; margin-bottom: 13px; }\n        .character-preview-wrap {\n            min-height: 118px;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            margin-bottom: 14px;\n            border: 3px solid #625851;\n            background: linear-gradient(#b8dcf0 0 64%,#9dcb82 64% 100%);\n        }\n        #characterPreview { width: 100px; height: 100px; display: flex; align-items: end; justify-content: center; }\n        #characterPreview .pixel-char { transform: scale(1.75); transform-origin: center bottom; }\n        .option-title { display: block; margin: 13px 0 7px; font-size: 12px; font-weight: 700; }\n        .hair-grid, .accessory-grid, .swatch-grid { display: grid; gap: 7px; }\n        .hair-grid, .accessory-grid { grid-template-columns: repeat(3,1fr); }\n        .swatch-grid { grid-template-columns: repeat(4,1fr); }\n        .color-dot { width: 24px; height: 24px; border: 2px solid rgba(0,0,0,.18); display: block; }\n        .form-error { display: none; padding: 9px; margin-bottom: 15px; background: #fff0ee; color: #9b4f49; font-size: 12px; }\n        .form-error.is-visible { display: block; }\n        .rsvp-submit {\n            width: 100%;\n            min-height: 50px;\n            border: 3px solid #403a36;\n            background: #8f8379;\n            color: #fff;\n            font-family: 'DungGeunMo', monospace;\n            box-shadow: 4px 4px 0 #403a36;\n        }\n        .rsvp-later { width: 100%; border: 0; background: transparent; text-decoration: underline; margin-top: 16px; padding: 8px; }\n        .privacy-note { margin-top: 15px; color: #9b928b; font-size: 10px; line-height: 1.55; text-align: center; }\n        .toast {\n            position: fixed;\n            z-index: 15000;\n            left: 50%;\n            bottom: 28px;\n            transform: translate(-50%,18px);\n            opacity: 0;\n            width: min(calc(100% - 40px),360px);\n            padding: 13px 16px;\n            background: #38322f;\n            color: #fff;\n            text-align: center;\n            transition: .25s;\n        }\n        .toast.is-visible { opacity: 1; transform: translate(-50%,0); }";
const RSVP_SECTION_HTML = '<section class="pixel-section" id="pixelGuestsSection">\n        <div class="pixel-kicker">OUR WEDDING GUESTS</div>\n        <h2 class="pixel-title">함께 채워지는 결혼식</h2>\n        <p class="pixel-count">현재 <strong id="guestCount">0</strong>명의 하객이 함께해요</p>\n\n        <div class="pixel-scene">\n            <div class="pixel-bg" aria-hidden="true">\n                <img src="whoiscoming.png" alt="">\n            </div>\n            <div class="group-photo-layer">\n                <div class="side-guests left" id="groomGuestLayer"></div>\n                <div class="couple-layer" id="coupleLayer"></div>\n                <div class="side-guests right" id="brideGuestLayer"></div>\n            </div>\n            <div class="pixel-empty" id="pixelEmpty">신랑과 신부 곁을 채워 주세요!<br>참석 의사를 남기면 나만의 픽셀 하객이 생겨요.</div>\n        </div>\n\n        <div class="pixel-side-labels"><span>◀ 신랑 측</span><span>신부 측 ▶</span></div>\n        <div class="rsvp-bottom-actions"><button class="rsvp-open-btn" id="openRsvpBtn">참석 의사 남기기</button></div>\n        <p class="backend-status" id="backendStatus"></p>\n    </section>\n\n    <footer class="pixel-footer">JINA ♥ HYUNGMIN<br>2026. 10. 11.</footer>';
const RSVP_MODAL_HTML = '<div class="rsvp-modal" id="rsvpModal">\n    <div class="rsvp-dialog">\n        <button class="rsvp-close-x" id="rsvpCloseX">×</button>\n        <div class="rsvp-dialog-header">\n            <div class="rsvp-dialog-kicker">PLEASE JOIN US</div>\n            <h2 class="rsvp-dialog-title">참석 의사를 알려주세요</h2>\n            <p class="rsvp-dialog-desc">남겨주신 답변은 예식 준비에 소중히 사용하겠습니다.</p>\n        </div>\n\n        <form class="rsvp-form" id="rsvpForm" novalidate>\n            <div class="form-group">\n                <span class="form-label">어느 쪽 하객이신가요?<span class="required">*</span></span>\n                <div class="choice-grid">\n                    <label class="choice-item"><input type="radio" name="side" value="groom"><span>🤵 신랑 측</span></label>\n                    <label class="choice-item"><input type="radio" name="side" value="bride"><span>👰 신부 측</span></label>\n                </div>\n            </div>\n\n            <div class="form-group">\n                <span class="form-label">참석 가능하신가요?<span class="required">*</span></span>\n                <div class="choice-grid">\n                    <label class="choice-item"><input type="radio" name="attendance" value="yes"><span>참석할게요</span></label>\n                    <label class="choice-item"><input type="radio" name="attendance" value="no"><span>참석이 어려워요</span></label>\n                </div>\n            </div>\n\n            <div class="form-group">\n                <label class="form-label">성함<span class="required">*</span></label>\n                <input class="text-input" id="guestName" maxlength="20" placeholder="예: 홍길동">\n            </div>\n\n            <div class="form-group">\n                <label class="form-label">전화번호 뒷자리 4자리<span class="required">*</span></label>\n                <input class="text-input" id="phoneLast4" inputmode="numeric" maxlength="4" placeholder="예: 1234">\n            </div>\n\n            <div class="form-group">\n                <span class="form-label">성별<span class="required">*</span></span>\n                <div class="choice-grid">\n                    <label class="choice-item"><input type="radio" name="gender" value="male"><span>남성</span></label>\n                    <label class="choice-item"><input type="radio" name="gender" value="female"><span>여성</span></label>\n                </div>\n            </div>\n\n            <div class="form-group character-customizer" id="characterCustomizer">\n                <div class="customizer-title">나만의 픽셀 하객 꾸미기</div>\n                <div class="character-preview-wrap"><div id="characterPreview"></div></div>\n\n                <span class="option-title">머리 모양</span>\n                <div class="hair-grid">\n                    <label class="mini-choice"><input type="radio" name="hairStyle" value="bald"><span>대머리</span></label>\n                    <label class="mini-choice"><input type="radio" name="hairStyle" value="short"><span>숏컷</span></label>\n                    <label class="mini-choice"><input type="radio" name="hairStyle" value="bob"><span>단발</span></label>\n                    <label class="mini-choice"><input type="radio" name="hairStyle" value="tied"><span>묶은머리</span></label>\n                    <label class="mini-choice"><input type="radio" name="hairStyle" value="wave"><span>웨이브</span></label>\n                    <label class="mini-choice"><input type="radio" name="hairStyle" value="perm"><span>파마</span></label>\n                    \n                </div>\n\n                <span class="option-title">머리색</span>\n                <div class="swatch-grid">\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="black"><span><i class="color-dot" style="background:#211d1b"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="darkBrown"><span><i class="color-dot" style="background:#3d2b25"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="brown"><span><i class="color-dot" style="background:#6b4632"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="lightBrown"><span><i class="color-dot" style="background:#a46f48"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="blonde"><span><i class="color-dot" style="background:#d8ad68"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="redBrown"><span><i class="color-dot" style="background:#8c4937"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="gray"><span><i class="color-dot" style="background:#77716f"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="hairColor" value="pinkBrown"><span><i class="color-dot" style="background:#95666c"></i></span></label>\n                </div>\n\n                <span class="option-title">피부색</span>\n                <div class="swatch-grid">\n                    <label class="mini-choice"><input type="radio" name="skinTone" value="light"><span><i class="color-dot" style="background:#ffe0d0"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="skinTone" value="warm"><span><i class="color-dot" style="background:#f3b99d"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="skinTone" value="tan"><span><i class="color-dot" style="background:#c97a55"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="skinTone" value="deep"><span><i class="color-dot" style="background:#82452f"></i></span></label>\n                </div>\n\n                <span class="option-title">상의색</span>\n                <div class="swatch-grid">\n                    <label class="mini-choice"><input type="radio" name="topColor" value="white"><span><i class="color-dot" style="background:#fffaf1"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="blue"><span><i class="color-dot" style="background:#629bc4"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="green"><span><i class="color-dot" style="background:#86a967"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="beige"><span><i class="color-dot" style="background:#e2cda7"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="pink"><span><i class="color-dot" style="background:#dca2aa"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="yellow"><span><i class="color-dot" style="background:#e4bd4f"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="purple"><span><i class="color-dot" style="background:#86638d"></i></span></label>\n                    <label class="mini-choice"><input type="radio" name="topColor" value="red"><span><i class="color-dot" style="background:#d94b45"></i></span></label>\n                </div>\n\n                <span class="option-title">악세사리</span>\n                <div class="accessory-grid">\n                    <label class="mini-choice"><input type="radio" name="accessory" value="none"><span>없음</span></label>\n                    <label class="mini-choice"><input type="radio" name="accessory" value="hat"><span>모자</span></label>\n                    <label class="mini-choice"><input type="radio" name="accessory" value="headband"><span>머리띠</span></label>\n                    <label class="mini-choice"><input type="radio" name="accessory" value="hairpin"><span>헤어핀</span></label>\n                    <label class="mini-choice"><input type="radio" name="accessory" value="glasses"><span>안경</span></label>\n                    <label class="mini-choice"><input type="radio" name="accessory" value="sunglasses"><span>선글라스</span></label>\n                    <label class="mini-choice"><input type="radio" name="accessory" value="flower"><span>꽃장식</span></label>\n                </div>\n            </div>\n\n            <div class="form-error" id="formError"></div>\n            <button class="rsvp-submit" id="rsvpSubmit">참석 의사 전달하기</button>\n            <button class="rsvp-later" id="rsvpLater" type="button">나중에 답할게요</button>\n            <p class="privacy-note">이름과 전화번호 뒷자리는 공개되지 않습니다.</p>\n        </form>\n    </div>\n</div>\n\n<div id="lightbox" class="lightbox">\n    <span class="lightbox-close" onclick="closeLightbox()">×</span>\n    <button class="lightbox-btn lightbox-prev" onclick="changeImage(-1)">❮</button>\n    <img id="lightbox-img" class="lightbox-content" src="" alt="">\n    <button class="lightbox-btn lightbox-next" onclick="changeImage(1)">❯</button>\n    <div id="lightbox-counter" class="lightbox-counter"></div>\n</div>\n\n<div class="toast" id="toast"></div>';

function addRsvpStyle() {
    if (document.getElementById('weddingRsvpAddonStyle')) return;
    const style = document.createElement('style');
    style.id = 'weddingRsvpAddonStyle';
    style.textContent = RSVP_STYLE;
    document.head.appendChild(style);
}

function addRsvpMarkup() {
    if (document.getElementById('pixelGuestsSection')) return;

    const phoneWrapper = document.querySelector('.phone-wrapper');
    if (!phoneWrapper) {
        console.error('RSVP addon: .phone-wrapper를 찾지 못했습니다.');
        return;
    }

    const sectionTemplate = document.createElement('template');
    sectionTemplate.innerHTML = RSVP_SECTION_HTML.trim();
    phoneWrapper.appendChild(sectionTemplate.content.cloneNode(true));

    const modalTemplate = document.createElement('template');
    modalTemplate.innerHTML = RSVP_MODAL_HTML.trim();
    document.body.appendChild(modalTemplate.content.cloneNode(true));
}

function loadFirebaseConfig() {
    return new Promise((resolve) => {
        if (window.WEDDING_FIREBASE_CONFIG) {
            resolve();
            return;
        }

        const existing = document.querySelector('script[src="firebase-config.js"]');
        if (existing) {
            if (window.WEDDING_FIREBASE_CONFIG) resolve();
            else existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', resolve, { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'firebase-config.js';
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
    });
}

async function initializeAddon() {
    addRsvpStyle();
    addRsvpMarkup();
    await loadFirebaseConfig();

    const RSVP_STORAGE_KEY='jina_hyungmin_rsvp';
const LOCAL_GUESTS_KEY='jina_hyungmin_local_guests';
const LOCAL_UID_KEY='jina_hyungmin_local_uid';
const SNOOZE_KEY='jina_hyungmin_rsvp_snoozed';

const appState={backend:null,uid:null,myRsvp:null,publicGuests:[],renderedGuestIds:new Set(),backendMode:'loading'};

const demoGuests=[
{id:'demo01',side:'groom',gender:'male',hairStyle:'short',hairColor:'black',skinTone:'warm',topColor:'white',accessory:'glasses',joinedAt:1},
{id:'demo02',side:'bride',gender:'female',hairStyle:'wave',hairColor:'darkBrown',skinTone:'light',topColor:'pink',accessory:'headband',joinedAt:2},
{id:'demo03',side:'groom',gender:'female',hairStyle:'bob',hairColor:'brown',skinTone:'warm',topColor:'green',accessory:'none',joinedAt:3},
{id:'demo04',side:'bride',gender:'male',hairStyle:'perm',hairColor:'lightBrown',skinTone:'tan',topColor:'blue',accessory:'sunglasses',joinedAt:4}
];

function toggleAcc(id){
    const content=document.getElementById(id);
    const mark=content.previousElementSibling.querySelector('span');
    if(content.style.maxHeight){content.style.maxHeight=null;mark.textContent='+';}
    else{content.style.maxHeight=content.scrollHeight+'px';mark.textContent='-';}
}
async function copyText(text){
    try{await navigator.clipboard.writeText(text);showToast('계좌번호가 복사되었습니다.');}
    catch(e){showToast('복사하지 못했습니다.');}
}
function calculateDday(){
    const gap=new Date('2026-10-11T00:00:00+09:00').getTime()-Date.now();
    const d=Math.ceil(gap/86400000);
    const el=document.getElementById('dDayText');
    el.innerHTML=d>0?`진아와 형민의 예식이 <strong>${d}일</strong> 남았습니다.`:d===0?'<strong>오늘</strong>은 예식일입니다!':`예식이 <strong>${Math.abs(d)}일</strong> 지났습니다.`;
}

let currentImageIndex=0,imagesList=[],touchstartX=0,touchendX=0;
function setupGallery(){
    const items=document.querySelectorAll('.gallery-item img');
    imagesList=[...items].map(i=>i.src);
    items.forEach((img,index)=>img.parentElement.onclick=()=>openLightbox(index));
    const box=document.getElementById('lightbox');
    box.addEventListener('touchstart',e=>touchstartX=e.changedTouches[0].screenX,{passive:true});
    box.addEventListener('touchend',e=>{touchendX=e.changedTouches[0].screenX;if(touchendX<touchstartX-50)changeImage(1);if(touchendX>touchstartX+50)changeImage(-1);},{passive:true});
}
function openLightbox(i){currentImageIndex=i;updateLightbox();document.getElementById('lightbox').style.display='flex';document.body.style.overflow='hidden';}
function closeLightbox(){document.getElementById('lightbox').style.display='none';document.body.style.overflow='';}
function changeImage(d){currentImageIndex=(currentImageIndex+d+imagesList.length)%imagesList.length;updateLightbox();}
function updateLightbox(){document.getElementById('lightbox-img').src=imagesList[currentImageIndex];document.getElementById('lightbox-counter').textContent=`${currentImageIndex+1} / ${imagesList.length}`;}
function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('is-visible');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('is-visible'),2600);}

function configIsReady(c){return['apiKey','authDomain','databaseURL','projectId','appId'].every(k=>typeof c?.[k]==='string'&&c[k].trim()&&!c[k].includes('PASTE_'));}
function getLocalUid(){let uid=localStorage.getItem(LOCAL_UID_KEY);if(!uid){uid=`local_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;localStorage.setItem(LOCAL_UID_KEY,uid);}return uid;}
function readLocalGuests(){try{const s=JSON.parse(localStorage.getItem(LOCAL_GUESTS_KEY)||'{}');return Object.entries(s).map(([id,v])=>({id,...v}));}catch(e){return[];}}
function createLocalBackend(){
    const uid=getLocalUid();appState.uid=uid;appState.backendMode='local';
    appState.myRsvp=JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY)||'null');
    const notify=()=>{appState.publicGuests=[...demoGuests,...readLocalGuests()];renderGuests(appState.publicGuests);};
    return{
        async save(rsvp,publicGuest){
            localStorage.setItem(RSVP_STORAGE_KEY,JSON.stringify(rsvp));
            const guests=JSON.parse(localStorage.getItem(LOCAL_GUESTS_KEY)||'{}');
            if(publicGuest)guests[uid]=publicGuest;else delete guests[uid];
            localStorage.setItem(LOCAL_GUESTS_KEY,JSON.stringify(guests));
            appState.myRsvp=rsvp;notify();
        },
        start(){notify();}
    };
}
async function createFirebaseBackend(config){
    const version='11.10.0';
    const [appModule,authModule,databaseModule]=await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${version}/firebase-database.js`)
    ]);
    const app=appModule.initializeApp(config);
    const auth=authModule.getAuth(app);
    const database=databaseModule.getDatabase(app);
    if(!auth.currentUser)await authModule.signInAnonymously(auth);
    const uid=auth.currentUser.uid;appState.uid=uid;
    const myRef=databaseModule.ref(database,`rsvps/${uid}`);
    const publicRef=databaseModule.ref(database,'publicGuests');
    return{
        async save(rsvp,publicGuest){
            await databaseModule.update(databaseModule.ref(database),{
                [`rsvps/${uid}`]:rsvp,
                [`publicGuests/${uid}`]:publicGuest||null
            });
            appState.myRsvp=rsvp;
        },
        start(){
            databaseModule.onValue(myRef,s=>{appState.myRsvp=s.exists()?s.val():null;updateRsvpButton();if(appState.myRsvp)fillForm(appState.myRsvp);maybeOpenFirstVisitModal();});
            databaseModule.onValue(publicRef,s=>{const v=s.val()||{};appState.publicGuests=Object.entries(v).map(([id,g])=>({id,...g}));renderGuests(appState.publicGuests);});
        }
    };
}
async function initializeRsvpBackend(){
    setBackendStatus('하객 정보를 불러오는 중입니다…');
    const config=window.WEDDING_FIREBASE_CONFIG||{};
    if(configIsReady(config)){
        try{appState.backend=await createFirebaseBackend(config);setBackendStatus('');}
        catch(e){console.error(e);appState.backend=createLocalBackend();setBackendStatus('현재 미리보기 모드입니다.');}
    }else{
        appState.backend=createLocalBackend();
        setBackendStatus('미리보기 모드 · firebase-config.js 설정 후 모든 하객에게 실시간 누적됩니다.');
    }
    appState.backend.start();updateRsvpButton();maybeOpenFirstVisitModal();
}
function setBackendStatus(m){document.getElementById('backendStatus').textContent=m;}
function normalizeGuests(gs){return gs.filter(g=>g&&g.side&&g.gender).sort((a,b)=>Number(a.joinedAt||0)-Number(b.joinedAt||0));}

function renderCouple(){
    const layer=document.getElementById('coupleLayer');layer.innerHTML='';
    layer.appendChild(buildPixelGuest({gender:'male',hairStyle:'part',hairColor:'black',skinTone:'light',topColor:'black',accessory:'none'},true,'groom'));
    layer.appendChild(buildPixelGuest({gender:'female',hairStyle:'long',hairColor:'darkBrown',skinTone:'light',topColor:'white',accessory:'flower'},true,'bride'));
}
function renderGuests(raw){
    const guests=normalizeGuests(raw),groom=document.getElementById('groomGuestLayer'),bride=document.getElementById('brideGuestLayer');
    groom.innerHTML='';bride.innerHTML='';
    [{list:guests.filter(g=>g.side==='groom'),layer:groom},{list:guests.filter(g=>g.side==='bride'),layer:bride}].forEach(({list,layer})=>{
        list.forEach((guest,index)=>{
            const p=buildPixelGuest(guest);
            if(index<Math.ceil(list.length/2))p.classList.add('back');
            if(appState.renderedGuestIds.size&&!appState.renderedGuestIds.has(guest.id))p.classList.add('is-new');
            layer.appendChild(p);
        });
    });
    document.getElementById('guestCount').textContent=guests.length;
    document.getElementById('pixelEmpty').style.display=guests.length?'none':'block';
    appState.renderedGuestIds=new Set(guests.map(g=>g.id));
    renderCouple();
}

function hairSvg(style,color){
    const o='#2a2523';
    const base=`<rect x="7" y="3" width="10" height="1" fill="${o}"/><rect x="5" y="4" width="14" height="2" fill="${o}"/><rect x="4" y="6" width="16" height="5" fill="${o}"/><rect x="8" y="4" width="8" height="1" fill="${color}"/><rect x="6" y="5" width="12" height="2" fill="${color}"/><rect x="5" y="7" width="14" height="4" fill="${color}"/>`;
    const s={
        bald:'',
        short:base+`<rect x="4" y="8" width="3" height="5" fill="${o}"/><rect x="17" y="8" width="3" height="5" fill="${o}"/>`,
        part:base+`<rect x="11" y="4" width="2" height="7" fill="${o}"/><rect x="4" y="8" width="3" height="6" fill="${o}"/><rect x="17" y="8" width="3" height="6" fill="${o}"/>`,
        bob:base+`<rect x="3" y="8" width="5" height="9" fill="${o}"/><rect x="16" y="8" width="5" height="9" fill="${o}"/><rect x="4" y="9" width="4" height="7" fill="${color}"/><rect x="16" y="9" width="4" height="7" fill="${color}"/>`,
        long:base+`<rect x="2" y="8" width="6" height="16" fill="${o}"/><rect x="16" y="8" width="6" height="16" fill="${o}"/><rect x="3" y="9" width="5" height="14" fill="${color}"/><rect x="16" y="9" width="5" height="14" fill="${color}"/>`,
        tied:base+`<rect x="18" y="5" width="4" height="4" fill="${o}"/><rect x="20" y="8" width="4" height="11" fill="${o}"/><rect x="19" y="6" width="3" height="3" fill="${color}"/><rect x="21" y="9" width="2" height="9" fill="${color}"/>`,
        bangs:base+`<rect x="6" y="8" width="12" height="3" fill="${color}"/><rect x="4" y="8" width="3" height="8" fill="${o}"/><rect x="17" y="8" width="3" height="8" fill="${o}"/>`,
        wave:base+`
            <rect x="2" y="8" width="6" height="16" fill="${o}"/>
            <rect x="16" y="8" width="6" height="16" fill="${o}"/>

            <rect x="3" y="8" width="5" height="15" fill="${color}"/>
            <rect x="16" y="8" width="5" height="15" fill="${color}"/>

            <rect x="2" y="11" width="2" height="4" fill="${color}"/>
            <rect x="4" y="15" width="2" height="4" fill="${o}"/>
            <rect x="3" y="16" width="2" height="3" fill="${color}"/>
            <rect x="2" y="20" width="2" height="3" fill="${color}"/>

            <rect x="20" y="11" width="2" height="4" fill="${color}"/>
            <rect x="18" y="15" width="2" height="4" fill="${o}"/>
            <rect x="19" y="16" width="2" height="3" fill="${color}"/>
            <rect x="20" y="20" width="2" height="3" fill="${color}"/>

            <rect x="5" y="21" width="3" height="3" fill="${color}"/>
            <rect x="16" y="21" width="3" height="3" fill="${color}"/>
        `,
        perm:`<rect x="6" y="2" width="12" height="2" fill="${o}"/><rect x="3" y="4" width="18" height="8" fill="${o}"/><rect x="4" y="5" width="16" height="6" fill="${color}"/>`,
    };
    return s[style]||s.short;
}
function accessorySvg(type){
    const o='#2a2523';
    const m={
        none:'',
        hat:`
            <!-- blue baseball cap -->
            <rect x="7" y="2" width="10" height="1" fill="${o}"/>
            <rect x="5" y="3" width="14" height="2" fill="${o}"/>
            <rect x="4" y="5" width="15" height="3" fill="${o}"/>

            <rect x="8" y="3" width="8" height="1" fill="#2f69a8"/>
            <rect x="6" y="4" width="12" height="2" fill="#3478bd"/>
            <rect x="5" y="6" width="13" height="1" fill="#3478bd"/>

            <rect x="8" y="3" width="4" height="1" fill="#4b8fd0"/>
            <rect x="6" y="4" width="3" height="1" fill="#4b8fd0"/>

            <!-- brim -->
            <rect x="14" y="6" width="7" height="2" fill="${o}"/>
            <rect x="15" y="6" width="6" height="1" fill="#245b95"/>
        `,
        headband:`
            <!-- feminine curved headband -->
            <rect x="6" y="4" width="12" height="1" fill="${o}"/>
            <rect x="5" y="5" width="2" height="5" fill="${o}"/>
            <rect x="17" y="5" width="2" height="5" fill="${o}"/>

            <rect x="7" y="5" width="10" height="1" fill="#e98fa0"/>
            <rect x="6" y="6" width="1" height="4" fill="#e98fa0"/>
            <rect x="17" y="6" width="1" height="4" fill="#e98fa0"/>

            <!-- small side bow -->
            <rect x="16" y="4" width="2" height="2" fill="#f3a8b5"/>
            <rect x="19" y="4" width="2" height="2" fill="#f3a8b5"/>
            <rect x="18" y="5" width="2" height="2" fill="#d66f82"/>
        `,
        hairpin:`<rect x="15" y="7" width="4" height="2" fill="#f0c65b"/>`,
        glasses:`<rect x="7" y="10" width="4" height="4" fill="none" stroke="${o}" stroke-width="1"/><rect x="13" y="10" width="4" height="4" fill="none" stroke="${o}" stroke-width="1"/><rect x="11" y="11" width="2" height="1" fill="${o}"/>`,
        sunglasses:`<rect x="7" y="10" width="4" height="4" fill="${o}"/><rect x="13" y="10" width="4" height="4" fill="${o}"/><rect x="11" y="11" width="2" height="1" fill="${o}"/>`,
        flower:`<rect x="16" y="5" width="2" height="2" fill="#f5c5ca"/><rect x="18" y="7" width="2" height="2" fill="#ed9da7"/><rect x="14" y="7" width="2" height="2" fill="#fff0d9"/><rect x="16" y="7" width="2" height="2" fill="#d9828d"/>`
    };
    return m[type]||'';
}
function makePixelSvg(g,isCouple=false,role=''){
    const skins={light:'#ffe0d0',warm:'#f3b99d',tan:'#c97a55',deep:'#82452f'};
    const tops={white:'#fffaf1',blue:'#629bc4',green:'#86a967',beige:'#e2cda7',pink:'#dca2aa',yellow:'#e4bd4f',purple:'#86638d',red:'#d94b45',black:'#333'};
    const hairs={black:'#211d1b',darkBrown:'#3d2b25',brown:'#6b4632',lightBrown:'#a46f48',blonde:'#d8ad68',redBrown:'#8c4937',gray:'#77716f',pinkBrown:'#95666c'};
    const o='#2a2523',skin=skins[g.skinTone]||skins.light,top=tops[g.topColor]||tops.navy;
    let hair=hairs[g.hairColor]||hairs.black;
    
    if(role==='groom')hair=hairs.black;if(role==='bride')hair=hairs.darkBrown;
    let body='';
    if(role==='groom')body=`<rect x="6" y="15" width="12" height="9" fill="${o}"/><rect x="7" y="16" width="10" height="7" fill="#292b30"/><rect x="10" y="16" width="4" height="5" fill="#fff"/><rect x="7" y="23" width="5" height="4" fill="#292b30"/><rect x="12" y="23" width="5" height="4" fill="#292b30"/>`;
    else if(role==='bride')body=`<rect x="7" y="15" width="10" height="7" fill="${o}"/><rect x="8" y="16" width="8" height="6" fill="#fffaf1"/><rect x="6" y="21" width="12" height="3" fill="#fffaf1"/><rect x="4" y="23" width="16" height="3" fill="#fffaf1"/><rect x="3" y="25" width="18" height="2" fill="#eee4d7"/>`;
    else if(g.gender==='female')body=`
        <rect x="6" y="15" width="12" height="8" fill="${o}"/>
        <rect x="7" y="16" width="10" height="6" fill="${top}"/>

        <!-- skirt: same color as men's pants -->
        <rect x="5" y="22" width="14" height="4" fill="${o}"/>
        <rect x="6" y="22" width="12" height="3" fill="#444a52"/>
    `;
    else body=`<rect x="6" y="15" width="12" height="8" fill="${o}"/><rect x="7" y="16" width="10" height="6" fill="${top}"/><rect x="7" y="22" width="5" height="5" fill="#444a52"/><rect x="12" y="22" width="5" height="5" fill="#444a52"/>`;
    const headSvg = g.hairStyle === 'bald'
        ? `
            <!-- bald rounded scalp -->
            <rect x="9" y="6" width="6" height="1" fill="${o}"/>
            <rect x="8" y="7" width="8" height="1" fill="${o}"/>
            <rect x="7" y="8" width="10" height="8" fill="${o}"/>

            <rect x="9" y="7" width="6" height="1" fill="${skin}"/>
            <rect x="8" y="8" width="8" height="7" fill="${skin}"/>

            <rect x="5" y="9" width="3" height="5" fill="${o}"/>
            <rect x="6" y="10" width="2" height="3" fill="${skin}"/>
            <rect x="16" y="9" width="3" height="5" fill="${o}"/>
            <rect x="16" y="10" width="2" height="3" fill="${skin}"/>
        `
        : `
            ${hairSvg(g.hairStyle,hair)}
            <rect x="5" y="9" width="3" height="5" fill="${o}"/>
            <rect x="6" y="10" width="2" height="3" fill="${skin}"/>
            <rect x="16" y="9" width="3" height="5" fill="${o}"/>
            <rect x="16" y="10" width="2" height="3" fill="${skin}"/>
            <rect x="7" y="7" width="10" height="9" fill="${o}"/>
            <rect x="8" y="8" width="8" height="7" fill="${skin}"/>
        `;

    return `<svg viewBox="0 0 24 28" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    ${headSvg}
    <rect x="9" y="10" width="1" height="2" fill="${o}"/><rect x="14" y="10" width="1" height="2" fill="${o}"/>
    <rect x="8" y="13" width="1" height="1" fill="#ed969e"/><rect x="15" y="13" width="1" height="1" fill="#ed969e"/>
    <rect x="11" y="13" width="2" height="1" fill="#a0605c"/>
    <rect x="10" y="15" width="4" height="2" fill="${skin}"/>
    ${body}
    <rect x="4" y="16" width="3" height="7" fill="${o}"/>
    <rect x="5" y="17" width="2" height="5" fill="${top}"/>
    <rect x="5" y="22" width="2" height="2" fill="${skin}"/>

    <rect x="17" y="16" width="3" height="7" fill="${o}"/>
    <rect x="17" y="17" width="2" height="5" fill="${top}"/>
    <rect x="17" y="22" width="2" height="2" fill="${skin}"/>

    <!-- thin black separation lines between arms and torso -->
    <rect x="6" y="16" width="1" height="7" fill="${o}"/>
    <rect x="17" y="16" width="1" height="7" fill="${o}"/>
    ${role!=='bride'?`<rect x="7" y="26" width="5" height="2" fill="${o}"/><rect x="13" y="26" width="5" height="2" fill="${o}"/>`:''}
    ${accessorySvg(g.accessory)}
    </svg>`;
}
function buildPixelGuest(g,isCouple=false,role=''){const p=document.createElement('div');p.className='pixel-char';p.innerHTML=makePixelSvg(g,isCouple,role);return p;}

function getCheckedValue(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||'';}
function updateCharacterPreview(){
    const g={side:getCheckedValue('side')||'groom',gender:getCheckedValue('gender')||'male',hairStyle:getCheckedValue('hairStyle')||'short',hairColor:getCheckedValue('hairColor')||'black',skinTone:getCheckedValue('skinTone')||'light',topColor:getCheckedValue('topColor')||'white',accessory:getCheckedValue('accessory')||'none'};
    const p=document.getElementById('characterPreview');p.innerHTML='';p.appendChild(buildPixelGuest(g));
}
function updateCustomizerVisibility(){document.getElementById('characterCustomizer').classList.toggle('is-visible',getCheckedValue('attendance')==='yes');updateCharacterPreview();}
function validateForm(){
    const data={side:getCheckedValue('side'),attendance:getCheckedValue('attendance')==='yes',name:document.getElementById('guestName').value.trim(),phoneLast4:document.getElementById('phoneLast4').value.trim(),gender:getCheckedValue('gender'),hairStyle:getCheckedValue('hairStyle'),hairColor:getCheckedValue('hairColor'),skinTone:getCheckedValue('skinTone'),topColor:getCheckedValue('topColor'),accessory:getCheckedValue('accessory')};
    if(!data.side)return{error:'신랑 측 또는 신부 측을 선택해 주세요.'};
    if(!getCheckedValue('attendance'))return{error:'참석 여부를 선택해 주세요.'};
    if(!data.name)return{error:'성함을 입력해 주세요.'};
    if(!/^\d{4}$/.test(data.phoneLast4))return{error:'전화번호 뒷자리 숫자 4자리를 입력해 주세요.'};
    if(!data.gender)return{error:'성별을 선택해 주세요.'};
    if(data.attendance&&(!data.hairStyle||!data.hairColor||!data.skinTone||!data.topColor||!data.accessory))return{error:'픽셀 하객 옵션을 모두 선택해 주세요.'};
    return{data};
}
function setFormError(m){const e=document.getElementById('formError');e.textContent=m||'';e.classList.toggle('is-visible',!!m);}
function setRadio(name,value){const r=document.querySelector(`input[name="${name}"][value="${value}"]`);if(r)r.checked=true;}
function fillForm(r){
    setRadio('side',r.side);setRadio('attendance',r.attendance?'yes':'no');setRadio('gender',r.gender);
    document.getElementById('guestName').value=r.name||'';document.getElementById('phoneLast4').value=r.phoneLast4||'';
    setRadio('hairStyle',r.hairStyle||'short');setRadio('hairColor',r.hairColor||'black');setRadio('skinTone',r.skinTone||'light');setRadio('topColor',r.topColor||'white');setRadio('accessory',r.accessory||'none');
    updateCustomizerVisibility();document.getElementById('rsvpSubmit').textContent='참석 의사 수정하기';
}
function resetForm(){
    document.getElementById('rsvpForm').reset();
    setRadio('hairStyle','short');setRadio('hairColor','black');setRadio('skinTone','light');setRadio('topColor','white');setRadio('accessory','none');
    document.getElementById('rsvpSubmit').textContent='참석 의사 전달하기';updateCustomizerVisibility();setFormError('');
}
function updateRsvpButton(){document.getElementById('openRsvpBtn').textContent=appState.myRsvp?'참석 의사 수정하기':'참석 의사 남기기';}
function openRsvpModal(){appState.myRsvp?fillForm(appState.myRsvp):resetForm();document.getElementById('rsvpModal').classList.add('is-open');document.body.style.overflow='hidden';}
function closeRsvpModal(){document.getElementById('rsvpModal').classList.remove('is-open');document.body.style.overflow='';setFormError('');}
function maybeOpenFirstVisitModal(){if(appState.myRsvp||sessionStorage.getItem(SNOOZE_KEY)==='1'||document.getElementById('rsvpModal').classList.contains('is-open'))return;setTimeout(openRsvpModal,450);}
async function handleRsvpSubmit(e){
    e.preventDefault();setFormError('');
    const v=validateForm();if(v.error){setFormError(v.error);return;}
    if(!appState.backend||!appState.uid){setFormError('저장 기능을 준비하고 있습니다.');return;}
    const now=Date.now(),previous=appState.myRsvp,d=v.data;
    const rsvp={...d,createdAt:previous?.createdAt||now,updatedAt:now};
    const publicGuest=d.attendance?{side:d.side,gender:d.gender,hairStyle:d.hairStyle,hairColor:d.hairColor,skinTone:d.skinTone,topColor:d.topColor,accessory:d.accessory,joinedAt:previous?.attendance&&previous?.createdAt?previous.createdAt:now,updatedAt:now}:null;
    try{
        await appState.backend.save(rsvp,publicGuest);appState.myRsvp=rsvp;updateRsvpButton();closeRsvpModal();
        showToast(d.attendance?'참석 의사가 전달되었습니다!':'답변이 전달되었습니다.');
    }catch(err){console.error(err);setFormError('저장하지 못했습니다. 다시 시도해 주세요.');}
}
function bindRsvpEvents(){
    document.getElementById('openRsvpBtn').onclick=openRsvpModal;
    document.getElementById('rsvpCloseX').onclick=closeRsvpModal;
    document.getElementById('rsvpForm').onsubmit=handleRsvpSubmit;
    document.getElementById('phoneLast4').oninput=e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);
    document.querySelectorAll('input[name="attendance"],input[name="gender"],input[name="side"],input[name="hairStyle"],input[name="hairColor"],input[name="skinTone"],input[name="topColor"],input[name="accessory"]').forEach(i=>i.addEventListener('change',()=>{updateCustomizerVisibility();updateCharacterPreview();}));
    document.getElementById('rsvpLater').onclick=()=>{sessionStorage.setItem(SNOOZE_KEY,'1');closeRsvpModal();};
    document.getElementById('rsvpModal').onclick=e=>{if(e.target.id==='rsvpModal')closeRsvpModal();};
}

    bindRsvpEvents();
    initializeRsvpBackend();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAddon, { once: true });
} else {
    initializeAddon();
}
})();
