const REJECT_MESSAGES = [
  "Are you kidding me?! You haven't finished shopping! Get back in those aisles!",
  "I don't care how 'close' you are — no items, no receipt! Scram!",
  "The checkout lane is NOT a rest stop. You still need {missing} more items!",
  "Ma'am. This is a grocery hunt, not a window-shopping tour. Go!",
  "I've seen impatient customers, but you take the cake — and you didn't even buy one!",
  "Empty basket? Empty checkout. That's how it works. Move it!",
  "Do I look like I accept excuses? Because I don't. Go find your stuff!",
  "Next! ...Oh wait, there's nothing TO check out. NEXT customer — that's you, leaving!"
];

const ALPHABETICAL_EASTER_EGG = [
  "Hold on... Applesauce before Bananas before Cereal...",
  "You collected these in strict alphabetical order.",
  "That's not a shopping list. That's a filing system with a pulse.",
  "I've worked here twelve years. Nobody — NOBODY — does that on purpose.",
  "Are your spice jars at home also sorted by Scoville units and then by hue?",
  "I'm going to need you to step aside so I can alphabetize the impulse-buy rack.",
  "The manager is going to hear about this. Not as a complaint. As a case study.",
  "Receipt says: every item, in order. Brain says: OCD unlocked. Achievement: 'The Aisle Auditor'.",
  "Please tell me your closet is organized by color, weight, AND emotional significance.",
  "You know what? Fine. Here's your receipt. Printed in alphabetical order. Obviously."
];

export function getRejectMessage(foundCount, totalCount) {
  const missing = totalCount - foundCount;
  const template = REJECT_MESSAGES[Math.floor(Math.random() * REJECT_MESSAGES.length)];
  return template.replace('{missing}', String(missing));
}

export function isAlphabeticalOrder(collectionOrder) {
  if (collectionOrder.length < 2) return true;

  for (let i = 1; i < collectionOrder.length; i++) {
    if (collectionOrder[i - 1].localeCompare(collectionOrder[i], undefined, { sensitivity: 'base' }) > 0) {
      return false;
    }
  }
  return true;
}

export function getAlphabeticalEasterEggMessage() {
  return ALPHABETICAL_EASTER_EGG[Math.floor(Math.random() * ALPHABETICAL_EASTER_EGG.length)];
}

export function getCheckoutSuccessMessage(totalCount) {
  return `Perfect! All ${totalCount} items accounted for. Have a great day!`;
}

const TIME_WARNING_MESSAGES = [
  "TEN SECONDS?! I'm literally rolling down the shutters! MOVE IT!",
  "The store closes when the clock says so — not when YOU'RE ready! HURRY!",
  "I've got one foot on the 'CLOSED' sign. You have seconds, not minutes!",
  "Checkout lane shuts in ten! This is not a suggestion — it's a countdown!",
  "Pat's patience expires in ten seconds. Your shopping list does NOT!"
];

export function getTimeWarningMessage() {
  return TIME_WARNING_MESSAGES[Math.floor(Math.random() * TIME_WARNING_MESSAGES.length)];
}
