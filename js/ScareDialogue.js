const SCARE_LINES = [
  'Go away! That is MY precious!',
  'Back off! I saw it on the shelf first!',
  'Find your own aisle, Karen!',
  'Mine! Mine! Mine! Get your own cart!',
  'Excuse me?! This hunt is PERSONAL!',
  'Not today! I need that exact yogurt!',
  'Shoo! Some of us are trying to shop seriously!',
  'Hands off my grocery destiny!',
  'You wouldn\'t steal a cart — don\'t steal my vibe!',
  'I will fight you over this canned soup!'
];

export function getScareLine() {
  return SCARE_LINES[Math.floor(Math.random() * SCARE_LINES.length)];
}
