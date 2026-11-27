// Keyboard and mouse controls for Tilly's Great Thanksgiving Escape.
// Space / Up / W jumps (twice for the wing flap), Down / S slides, P or
// Esc pauses, M mutes. A mouse click jumps too — and on the title, pause
// and end screens it presses the on-screen buttons.

export function attachInput(engine, canvas) {
  const sound = engine.sound;

  function pressButton(id) {
    if (id === 'start' || id === 'restart') engine.startRun();
    else if (id === 'resume') engine.resume();
    else if (id === 'title') engine.toTitle();
  }

  function buttonAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    for (const b of engine.uiButtons || []) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
    }
    return null;
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const code = event.code;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
      event.preventDefault();
      sound.unlock();
      engine.jump();
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      event.preventDefault();
      sound.unlock();
      engine.slide();
    } else if (code === 'KeyP' || code === 'Escape') {
      if (engine.state === 'playing') engine.pause();
      else if (engine.state === 'paused') engine.resume();
    } else if (code === 'KeyM') {
      sound.unlock();
      sound.setMuted(!sound.muted);
    } else if (code === 'Enter') {
      sound.unlock();
      if (engine.state === 'title' || engine.state === 'caught' || engine.state === 'escaped') {
        engine.startRun();
      }
    }
  });

  canvas.addEventListener('mousedown', (event) => {
    sound.unlock();
    const id = buttonAt(event.clientX, event.clientY);
    if (id) {
      pressButton(id);
      return;
    }
    // Clicking anywhere else jumps — the whole game is one big button.
    engine.jump();
  });

  canvas.addEventListener('mousemove', (event) => {
    engine.hoverButton = buttonAt(event.clientX, event.clientY);
  });

  // Touch: a tap is a jump, just like a click.
  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    sound.unlock();
    const touch = event.touches[0];
    const id = buttonAt(touch.clientX, touch.clientY);
    if (id) pressButton(id);
    else engine.jump();
  }, { passive: false });
}
