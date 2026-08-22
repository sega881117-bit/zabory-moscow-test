(() => {
  const form = document.querySelector('.lead-form');
  const status = document.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');

  // Публичный seam: серверный маршрут доставляет лид в test8812.amocrm.ru.
  // Клиент не содержит URL amoCRM, ключей или других секретов.
  const leadEndpoint = window.LEAD_WEBHOOK_URL || '';
  window.submitLead = window.submitLead || (async (payload) => {
    if (!leadEndpoint) {
      return { ok: false, message: 'Тестовый маршрут для заявки ещё не настроен. Попробуйте позже.' };
    }
    const response = await fetch(leadEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), credentials: 'omit'
    });
    const result = await response.json().catch(() => ({}));
    return { ok: response.ok && result.ok === true, message: result.message || 'Не удалось передать заявку. Проверьте связь и повторите попытку.' };
  });

  const validate = (values) => ({
    name: values.name.trim().length >= 2 ? '' : 'Укажите имя — не менее двух символов.',
    phone: values.phone.replace(/\D/g, '').length >= 10 ? '' : 'Укажите телефон в удобном формате.',
    material: values.material ? '' : 'Выберите материал забора.',
    address: values.address.trim().length >= 3 ? '' : 'Укажите город, посёлок или район участка.'
  });

  const showErrors = (errors) => {
    Object.entries(errors).forEach(([field, message]) => {
      const formControl = form.elements[field];
      const inputs = formControl?.length && !formControl.closest ? [...formControl] : [formControl];
      const input = inputs[0];
      const error = document.getElementById(`${field}-error`);
      input.closest('.form-field').classList.toggle('has-error', Boolean(message));
      inputs.forEach((control) => control.setAttribute('aria-invalid', Boolean(message)));
      error.textContent = message;
    });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    const errors = validate(values);
    showErrors(errors);
    status.textContent = '';
    status.className = 'form-status';
    if (Object.values(errors).some(Boolean)) {
      status.textContent = 'Проверьте поля, отмеченные ниже.';
      status.classList.add('error');
      return;
    }
    button.disabled = true;
    button.textContent = 'Отправляем…';
    try {
      const gates = formData.getAll('gates');
      const result = await window.submitLead({
        name: values.name.trim(),
        phone: values.phone.trim(),
        service: values.material,
        comment: [
          `Длина: ${values.length?.trim() || 'не указана'} м.п.`,
          `Высота: ${values.height || '2 м'}`,
          `Ворота/калитка: ${gates.length ? gates.join(', ') : 'не нужны'}`,
          `Адрес участка: ${values.address.trim()}`
        ].join('\n')
      });
      if (!result || !result.ok) throw new Error(result?.message || 'Не удалось передать заявку.');
      status.textContent = result.message || 'Заявка принята. Скоро подготовим предварительный расчёт.';
      status.classList.add('success');
      form.querySelectorAll('input, select, textarea').forEach((field) => field.disabled = true);
      button.textContent = 'Заявка отправлена';
    } catch (error) {
      status.textContent = error.message || 'Не удалось отправить заявку. Проверьте связь и повторите попытку.';
      status.classList.add('error');
      button.disabled = false;
      button.textContent = 'Повторить отправку';
    }
  });
})();

// The cinematic hero is CSS-driven; pause its compositor work when the tab is hidden.
if (document.querySelector('.triptych')) {
  const syncTriptychMotion = () => document.body.classList.toggle('is-hidden', document.hidden);
  document.addEventListener('visibilitychange', syncTriptychMotion, { passive: true });
  syncTriptychMotion();
}
