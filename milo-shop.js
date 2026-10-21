/* Milo's Study Zone wardrobe. Purchases are stored locally for each profile. */
(function () {
  const ITEMS = [
    { id: 'pup-hood', slot: 'hat', value: 'dog', name: 'Pup Hood', kind: 'Dog hat', description: 'A soft little hood with floppy ears.', mark: '🐶', price: 20 },
    { id: 'cool-shades', slot: 'shades', value: 'cool', name: 'Cool Shades', kind: 'Sunglasses', description: 'A little shade for sunny study days.', mark: '🕶️', price: 15 },
    { id: 'sleepy-face', slot: 'face', value: 'sleepy', name: 'Sleepy Smile', kind: 'Milo face', description: 'A calm, cosy expression.', mark: '☾', price: 10 },
    { id: 'wink-face', slot: 'face', value: 'wink', name: 'Little Wink', kind: 'Milo face', description: 'A cheerful wink for your next session.', mark: '☺', price: 10 },
    { id: 'bright-face', slot: 'face', value: 'bright', name: 'Starry Eyes', kind: 'Milo face', description: 'Bright eyes with tiny golden sparkles.', mark: '✧', price: 15 }
  ];
  const WARDROBE_KEY = 'sorenity_milo_wardrobe_';

  function activeUserId() {
    return window.causalStorage?.getActiveUserId?.() || 'usr_emmanuel';
  }

  function emptyWardrobe() {
    return { owned: [], equipped: { hat: null, shades: null, face: null } };
  }

  function loadWardrobe(userId) {
    try {
      const saved = JSON.parse(localStorage.getItem(WARDROBE_KEY + userId) || 'null');
      if (!saved || typeof saved !== 'object') return emptyWardrobe();
      return {
        owned: Array.isArray(saved.owned) ? saved.owned.filter(id => ITEMS.some(item => item.id === id)) : [],
        equipped: { ...emptyWardrobe().equipped, ...(saved.equipped || {}) }
      };
    } catch (_) {
      return emptyWardrobe();
    }
  }

  function initMiloShop() {
    const openButton = document.getElementById('milo-shop-open');
    const dialog = document.getElementById('milo-shop-dialog');
    const closeButton = document.getElementById('milo-shop-close');
    const resetLookButton = document.getElementById('milo-shop-reset');
    const itemsContainer = document.getElementById('milo-shop-items');
    const balanceLabel = document.getElementById('milo-shop-balance-value');
    const status = document.getElementById('milo-shop-status');
    const milo = document.getElementById('milo-character');
    if (!openButton || !dialog || !itemsContainer || !milo) return;

    let userId = activeUserId();
    let wardrobe = loadWardrobe(userId);

    function saveWardrobe() {
      try { localStorage.setItem(WARDROBE_KEY + userId, JSON.stringify(wardrobe)); } catch (_) {}
    }

    function applyLook() {
      milo.dataset.hat = wardrobe.equipped.hat || 'none';
      milo.dataset.shades = wardrobe.equipped.shades || 'none';
      milo.dataset.face = wardrobe.equipped.face || 'default';
    }

    function getBalance() {
      return window.sorenityStarWallet?.getBalance?.() ?? 0;
    }

    function updateBalance() {
      const balance = getBalance();
      if (balanceLabel) balanceLabel.textContent = String(balance);
      return balance;
    }

    function renderItems() {
      const balance = updateBalance();
      itemsContainer.replaceChildren();
      ITEMS.forEach(item => {
        const owned = wardrobe.owned.includes(item.id);
        const equipped = wardrobe.equipped[item.slot] === item.value;
        const card = document.createElement('article');
        card.className = 'milo-shop-item';

        const mark = document.createElement('span');
        mark.className = 'milo-shop-item-mark';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = item.mark;

        const copy = document.createElement('div');
        copy.className = 'milo-shop-item-copy';
        const name = document.createElement('strong');
        name.textContent = item.name;
        const description = document.createElement('span');
        description.textContent = item.description;
        copy.append(name, description);

        const action = document.createElement('button');
        action.type = 'button';
        action.className = `milo-shop-item-action${owned ? ' is-owned' : ''}`;
        action.textContent = equipped ? 'Equipped' : owned ? 'Equip' : balance < item.price ? `Need ${item.price - balance} ✦` : `Buy · ${item.price} ✦`;
        action.disabled = equipped || (!owned && balance < item.price);
        action.addEventListener('click', () => {
          if (owned) {
            wardrobe.equipped[item.slot] = item.value;
            status.textContent = `${item.name} is ready for Milo.`;
          } else {
            const wallet = window.sorenityStarWallet;
            if (!wallet?.spend?.(item.price)) {
              status.textContent = 'You need a few more Star Points for that look.';
              renderItems();
              return;
            }
            wardrobe.owned.push(item.id);
            wardrobe.equipped[item.slot] = item.value;
            status.textContent = `${item.name} is yours and Milo has it on.`;
          }
          saveWardrobe();
          applyLook();
          renderItems();
        });

        card.append(mark, copy, action);
        itemsContainer.appendChild(card);
      });
    }

    openButton.addEventListener('click', () => {
      status.textContent = '';
      renderItems();
      dialog.showModal();
    });
    closeButton?.addEventListener('click', () => dialog.close());
    resetLookButton?.addEventListener('click', () => {
      wardrobe.equipped = emptyWardrobe().equipped;
      saveWardrobe();
      applyLook();
      status.textContent = 'Milo is back in his original look.';
      renderItems();
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    window.addEventListener('sorenity-star-points-changed', renderItems);
    window.addEventListener('sorenity-profile-changed', () => {
      userId = activeUserId();
      wardrobe = loadWardrobe(userId);
      applyLook();
      if (dialog.open) renderItems();
    });

    applyLook();
    updateBalance();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMiloShop);
  else initMiloShop();
})();
