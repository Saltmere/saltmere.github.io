'use strict';
const feedback = document.getElementById('feedback');
const blank = document.getElementById('answer-blank');
const reset = document.getElementById('reset-demo');
const choices = [...document.querySelectorAll('[data-answer]')];
const explanations = {
  walk: '“She” ile geniş zamanda fiile -s eklenir. “Every morning” bize düzenli yapılan bir şeyi anlatıyor. Bir daha dene.',
  walking: '“Walking” tek başına burada kullanılamaz. “Every morning” bir rutini anlatıyor; bu cümlede geniş zaman gerekiyor. Bir daha dene.'
};
for (const choice of choices) {
  choice.setAttribute('aria-pressed', 'false');
  choice.addEventListener('click', () => {
    const answer = choice.dataset.answer;
    for (const other of choices) other.setAttribute('aria-pressed', String(other === choice));
    blank.textContent = answer;
    feedback.replaceChildren();
    const title = document.createElement('strong');
    const explanation = document.createElement('p');
    const correct = answer === 'walks';
    title.textContent = correct ? '✓ Doğru: walks.' : 'Bir daha bakalım.';
    explanation.textContent = correct ? 'She / he / it ile geniş zamanda fiile -s eklenir. “She walks here every morning.” = Her sabah burada yürür.' : explanations[answer];
    feedback.append(title, explanation);
    feedback.classList.toggle('success', correct);
    reset.hidden = !correct;
  });
}
reset.addEventListener('click', () => {
  blank.textContent = '…';
  for (const choice of choices) choice.setAttribute('aria-pressed', 'false');
  feedback.classList.remove('success');
  const prompt = document.createElement('p');
  prompt.textContent = 'Bir kelime seç. Yanlış cevapta da açıklamayla devam edebilirsin.';
  feedback.replaceChildren(prompt);
  reset.hidden = true;
  choices[0].focus();
});

// Depth and motion stay decorative; all content works without them.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.documentElement.classList.add('motion-enabled');
  const targets = document.querySelectorAll('.demo-intro,.case-demo,.section-heading,.play-actions article,.seasons li,.silas-portrait,.silas-copy,.plan-card,.faq-list,.closing>*,.footer');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
    }), {threshold: .08});
    targets.forEach((el,i) => {el.classList.add('reveal');el.style.setProperty('--delay',`${(i % 3)*65}ms`);observer.observe(el);});
  }
  const hero = document.querySelector('.hero');
  if (finePointer) {
    hero.addEventListener('pointermove', e => {
      const r=hero.getBoundingClientRect();
      hero.style.setProperty('--mx', ((e.clientX-r.left)/r.width-.5)*2);
      hero.style.setProperty('--my', ((e.clientY-r.top)/r.height-.5)*2);
    },{passive:true});
    hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--mx',0);hero.style.setProperty('--my',0);});
    document.querySelectorAll('.case-demo,.play-actions article,.seasons li').forEach(card=>{
      let frame;
      card.addEventListener('pointermove',e=>{
        cancelAnimationFrame(frame);
        frame=requestAnimationFrame(()=>{
          const r=card.getBoundingClientRect();
          const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
          card.style.transform=`perspective(1000px) rotateX(${-y*7}deg) rotateY(${x*9}deg) translateY(-3px)`;
        });
      },{passive:true});
      card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);card.style.transform='';});
    });
  }
  const canvas=document.getElementById('atmosphere'),ctx=canvas?.getContext('2d');
  if(!ctx)return;
  let width=0,height=0,frame=0,visible=true,last=0;
  const specks=Array.from({length:finePointer?35:16},()=>({x:Math.random(),y:Math.random(),z:.25+Math.random()*.75,s:Math.random()*6}));
  const resize=()=>{width=hero.clientWidth;height=hero.clientHeight;const dpr=Math.min(devicePixelRatio,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};
  const draw=time=>{
    if(!visible||document.hidden){frame=0;return;}
    const dt=Math.min((time-last)||16,40);last=time;
    ctx.clearRect(0,0,width,height);
    specks.forEach(p=>{p.y-=dt*.000008*p.z;p.x+=Math.sin(time*.0002+p.s)*dt*.000002;if(p.y<0)p.y=1;ctx.beginPath();ctx.fillStyle=`rgba(185,218,224,${.08+p.z*.17})`;ctx.arc(p.x*width,p.y*height,.5+p.z,0,Math.PI*2);ctx.fill();});
    frame=requestAnimationFrame(draw);
  };
  const resume=()=>{if(visible&&!document.hidden&&!frame){last=performance.now();frame=requestAnimationFrame(draw);}};
  resize();window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else resume();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(hero);
  resume();
})();
