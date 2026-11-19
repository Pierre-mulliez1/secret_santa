const form = document.getElementById("form");
    const password = document.getElementById("password");
    const feedback = document.getElementById("feedback");
    const welcome = document.getElementById("welcome");
    const reveal = document.getElementById("reveal");
    const gift = document.getElementById("gift");
    const giftLabel = document.getElementById("gift-label");
    const giftPrompt = document.getElementById("gift-prompt");
    const revealWarning = document.getElementById("reveal-warning");
    const result = document.getElementById("result");
    const secret = document.getElementById("secret");
    const sessionKey = "secret-santa-revealed";
    const unlockedKey = "secret-santa-unlocked";
    let revealedName = "";
    let revealTimer;

    document.getElementById("unlock").addEventListener("click", () => {
      sessionStorage.setItem(unlockedKey, "1");
      feedback.textContent = "";
      feedback.classList.remove("grinch");
      revealWarning.hidden = true;
    });

    const snow = document.getElementById("snow");
    for (let index = 0; index < 24; index += 1) {
      const flake = document.createElement("span");
      flake.className = "flake";
      flake.textContent = "\u2744";
      flake.style.left = `${(index * 37) % 100}%`;
      flake.style.fontSize = `${9 + (index % 4) * 4}px`;
      flake.style.setProperty("--duration", `${10 + (index % 7) * 2}s`);
      flake.style.setProperty("--delay", `${-(index % 13)}s`);
      flake.style.setProperty("--drift", `${(index % 2 ? 1 : -1) * (20 + index % 4 * 15)}px`);
      snow.appendChild(flake);
    }

    const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));

    async function decryptRecord(record, code) {
      const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({name: "PBKDF2", salt: decode(record.salt), iterations: 150000, hash: "SHA-256"}, material, {name: "AES-GCM", length: 256}, false, ["decrypt"]);
      const plaintext = await crypto.subtle.decrypt({name: "AES-GCM", iv: decode(record.iv)}, key, decode(record.data));
      return new TextDecoder().decode(plaintext);
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (sessionStorage.getItem(sessionKey) && !sessionStorage.getItem(unlockedKey)) {
        feedback.classList.add("grinch");
        feedback.textContent = "M\u00e8le-toi de ton tirage";
        return;
      }
      feedback.classList.remove("grinch");
      const records = window.SECRET_SANTA_RECORDS;
      if (!Array.isArray(records) || !records.length) {
        feedback.textContent = "Le tirage n'est pas encore disponible.";
        return;
      }
      if (!window.crypto || !window.crypto.subtle) {
        feedback.textContent = "Ce navigateur ne permet pas d'ouvrir le tirage.";
        return;
      }
      const button = form.querySelector("button");
      button.disabled = true;
      feedback.textContent = "";
      const code = password.value.normalize("NFC").trim().toLocaleLowerCase("fr-FR");
      try {
        for (const record of records) {
          try {
            revealedName = await decryptRecord(record, code);
            password.value = "";
            welcome.hidden = true;
            reveal.hidden = false;
            gift.focus();
            return;
          } catch (error) {
            if (!(error instanceof DOMException) || error.name !== "OperationError") throw error;
          }
        }
        feedback.textContent = "Ce code ne correspond pas au tirage.";
      } catch (error) {
        feedback.textContent = "Impossible d'ouvrir le tirage.";
      } finally {
        button.disabled = false;
      }
    });

    gift.addEventListener("click", () => {
      if (sessionStorage.getItem(sessionKey) && !sessionStorage.getItem(unlockedKey)) {
        revealWarning.hidden = false;
        return;
      }
      if (!revealedName || !result.hidden) return;
      sessionStorage.setItem(sessionKey, "1");
      gift.classList.add("opening");
      revealTimer = setTimeout(() => {
        secret.textContent = revealedName;
        giftLabel.hidden = true;
        giftPrompt.hidden = true;
        result.hidden = false;
      }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650);
    });

    document.getElementById("reset").addEventListener("click", () => {
      clearTimeout(revealTimer);
      revealedName = "";
      secret.textContent = "";
      result.hidden = true;
      giftLabel.hidden = false;
      giftPrompt.hidden = false;
      revealWarning.hidden = true;
      gift.classList.remove("opening");
      reveal.hidden = true;
      welcome.hidden = false;
      feedback.textContent = "";
      feedback.classList.remove("grinch");
      password.focus();
    });