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
