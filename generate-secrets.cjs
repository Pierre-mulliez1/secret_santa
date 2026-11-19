const { readFileSync } = require("node:fs");
const { randomBytes, randomInt, pbkdf2Sync, createCipheriv } = require("node:crypto");

const input = process.argv[2];
if (!input) {
  console.error("Usage: node generate-secrets.cjs <private-json> [--tirage]");
  process.exit(1);
}

try {
  const participants = JSON.parse(readFileSync(input, "utf8"));
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error("Le fichier doit contenir une liste non vide de participants.");
  }
  const draw = process.argv.includes("--tirage");
  if (draw && participants.length < 2) {
    throw new Error("Le tirage necessite au moins deux participants.");
  }
  const codes = new Set();
  const names = new Set();
  const entries = participants.map(participant => {
    if (typeof participant.prenom !== "string" || !participant.prenom.trim() || (!draw && (typeof participant.secret !== "string" || !participant.secret.trim()))) {
      throw new Error("Chaque participant doit avoir un prenom et, sans --tirage, un secret non vides.");
    }
    const letters = Array.from(participant.prenom.normalize("NFC").trim().toLocaleLowerCase("fr-FR"));
    const name = letters.join("");
    if (names.has(name)) throw new Error("Deux participants ont le meme prenom.");
    names.add(name);
    if (participant.code !== undefined && (typeof participant.code !== "string" || !participant.code.trim())) {
      throw new Error("Chaque code doit etre une chaine non vide.");
    }
    const code = participant.code === undefined ? letters[0] + letters[letters.length - 1] : participant.code.normalize("NFC").trim().toLocaleLowerCase("fr-FR");
    if (codes.has(code)) {
      throw new Error("Deux participants ont le meme code : changez le tirage ou les codes.");
    }
    codes.add(code);
    return { name: participant.prenom.trim(), code, secret: participant.secret };
  });
  let recipients;
  if (draw) {
    do {
      recipients = entries.map(entry => entry.name);
      for (let index = recipients.length - 1; index > 0; index -= 1) {
        const other = randomInt(index + 1);
        [recipients[index], recipients[other]] = [recipients[other], recipients[index]];
      }
    } while (recipients.some((recipient, index) => recipient === entries[index].name));
  }
  const records = entries.map((entry, index) => {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = pbkdf2Sync(entry.code, salt, 150000, 32, "sha256");
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const data = Buffer.concat([cipher.update(draw ? recipients[index] : entry.secret, "utf8"), cipher.final(), cipher.getAuthTag()]);
    return {salt: salt.toString("base64"), iv: iv.toString("base64"), data: data.toString("base64")};
  });
  process.stdout.write(`window.SECRET_SANTA_RECORDS = ${JSON.stringify(records)};\n`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}