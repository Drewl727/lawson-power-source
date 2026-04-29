/* ============================================================
   Lawson Power Source — Electrical Emergency Checker
   Decision-tree widget: walks homeowners through yes/no
   questions and returns a severity result.
   ============================================================ */

const QUESTIONS = [
  {
    id: 1,
    text: 'Is there sparking, a burning smell, or visible smoke?',
    context: 'These are signs of an active electrical fire or arc fault.',
    yesResult: 'emergency',
  },
  {
    id: 2,
    text: 'Has power gone out in part or all of your home?',
    context: 'A partial outage can indicate a failing circuit, bad main breaker, or utility issue.',
    yesResult: null, // continue — power-out context feeds into Q3
    setsFlag: 'powerOut',
  },
  {
    id: 3,
    text: 'Are your circuit breakers tripping repeatedly?',
    context: 'Breakers that keep tripping are being overloaded or protecting against a fault.',
    yesResult: 'urgent',
  },
  {
    id: 4,
    text: 'Are outlets warm to the touch, discolored, or making noise?',
    context: 'Warm or buzzing outlets signal wiring problems that need prompt attention.',
    yesResult: 'urgent',
  },
  {
    id: 5,
    text: 'Are lights flickering or dimming randomly?',
    context: 'Unexplained flickering can indicate loose connections or an overloaded circuit.',
    yesResult: 'schedule-soon',
  },
];

const RESULTS = {
  emergency: {
    level: 'EMERGENCY',
    badgeClass: 'result-badge--emergency',
    title: 'Call Us Now',
    desc:
      'Your situation may involve an active electrical hazard. Do not delay — shut off power at the main breaker if safe to do so, evacuate if you smell smoke, and call us immediately.',
    ctaPhone: true,
  },
  urgent: {
    level: 'URGENT',
    badgeClass: 'result-badge--urgent',
    title: 'Schedule Within 48 Hrs',
    desc:
      'This issue needs prompt attention before it becomes a safety risk. We recommend scheduling a service call today — our team can typically respond within 24–48 hours.',
    ctaPhone: false,
  },
  'schedule-soon': {
    level: 'SCHEDULE SOON',
    badgeClass: 'result-badge--schedule',
    title: 'Make an Appointment',
    desc:
      'Your electrical system needs a professional inspection but is not an immediate emergency. Give us a call or request an appointment online and we will get you on the schedule.',
    ctaPhone: false,
  },
  maintenance: {
    level: 'MAINTENANCE',
    badgeClass: 'result-badge--maintenance',
    title: 'No Urgent Action Needed',
    desc:
      'Based on your answers, this sounds like a routine maintenance or upgrade situation. We still recommend having a licensed electrician inspect your system — book a standard appointment at your convenience.',
    ctaPhone: false,
  },
};

function initChecker(containerId) {
  const root = document.getElementById(containerId);
  if (!root) return;

  let currentIndex = 0;
  let flags = {};

  // DOM refs (rendered in renderQuestion)
  const progressEl = root.querySelector('.checker-progress');
  const bodyEl     = root.querySelector('.checker-body-content');
  const liveEl     = root.querySelector('[aria-live]');

  // Build progress pips
  function renderProgress() {
    progressEl.innerHTML = '';
    QUESTIONS.forEach((_, i) => {
      const pip = document.createElement('div');
      pip.className = 'checker-progress__step';
      if (i < currentIndex)  pip.classList.add('is-done');
      if (i === currentIndex) pip.classList.add('is-active');
      progressEl.appendChild(pip);
    });
  }

  function renderQuestion() {
    const q = QUESTIONS[currentIndex];
    renderProgress();

    bodyEl.innerHTML = `
      <p class="checker-question" id="checker-q-label">${q.text}</p>
      <p class="checker-context">${q.context}</p>
      <div class="checker-btns" role="group" aria-labelledby="checker-q-label">
        <button class="checker-btn checker-btn--yes" data-answer="yes" aria-label="Yes — ${q.text}">YES</button>
        <button class="checker-btn checker-btn--no"  data-answer="no"  aria-label="No — ${q.text}">NO</button>
      </div>
    `;

    // Announce question to screen readers
    if (liveEl) liveEl.textContent = `Question ${currentIndex + 1} of ${QUESTIONS.length}: ${q.text}`;

    bodyEl.querySelectorAll('.checker-btn').forEach((btn) => {
      btn.addEventListener('click', handleAnswer);
    });
  }

  function handleAnswer(e) {
    const answer = e.currentTarget.dataset.answer;
    const q      = QUESTIONS[currentIndex];

    if (q.setsFlag && answer === 'yes') {
      flags[q.setsFlag] = true;
    }

    if (answer === 'yes' && q.yesResult) {
      showResult(q.yesResult);
      return;
    }

    // Q2 "powerOut" + answer "no" — still advance
    currentIndex++;
    if (currentIndex >= QUESTIONS.length) {
      showResult('maintenance');
    } else {
      renderQuestion();
    }
  }

  function showResult(key) {
    const r = RESULTS[key];
    renderProgress(); // fill all pips

    // Override: power-out + reaching maintenance → upgrade to schedule-soon
    if (key === 'maintenance' && flags.powerOut) {
      showResult('schedule-soon');
      return;
    }

    const phoneBtn = r.ctaPhone
      ? `<a href="tel:8609831663" class="btn btn--emergency">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.5z"/></svg>
           Call Now: (860) 983-1663
         </a>`
      : `<a href="contact.html" class="btn btn--primary">Request an Appointment</a>`;

    bodyEl.innerHTML = `
      <div class="checker-result" role="status" aria-live="polite">
        <span class="result-badge ${r.badgeClass}" aria-label="Severity level: ${r.level}">
          ${r.level}
        </span>
        <p class="result-title">${r.title}</p>
        <p class="result-desc">${r.desc}</p>
        <div class="result-cta">
          ${phoneBtn}
          <a href="contact.html" class="btn btn--outline-amber">Get a Free Quote</a>
        </div>
        <button class="checker-restart" aria-label="Start the emergency checker over">Start Over</button>
      </div>
    `;

    if (liveEl) liveEl.textContent = `Result: ${r.level}. ${r.title}. ${r.desc}`;

    bodyEl.querySelector('.checker-restart').addEventListener('click', reset);
  }

  function reset() {
    currentIndex = 0;
    flags = {};
    renderQuestion();
    // Move focus back to first question for keyboard users
    setTimeout(() => {
      const firstBtn = bodyEl.querySelector('.checker-btn');
      if (firstBtn) firstBtn.focus();
    }, 50);
  }

  // Init
  renderQuestion();
}

// Auto-initialize if the container exists
document.addEventListener('DOMContentLoaded', () => {
  initChecker('emergency-checker');
});
