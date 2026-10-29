const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = "demo-no-project";
const ALICE_UID = "alice_user_123";
const BOB_UID = "bob_user_456";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user: cannot read decks", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).collection("decks").get());
});

test("Alice cannot read Bob's decks", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("users").doc(BOB_UID).collection("decks").doc("deck_1").set({
      title: "Bob's Deck",
      subject: "History",
      sourceType: "textbook",
      cardCount: 20,
      masteredCount: 0,
      reviewCount: 20,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(aliceDb.collection("users").doc(BOB_UID).collection("decks").doc("deck_1").get());
});

test("Alice can create and read her own deck", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const deckRef = aliceDb.collection("users").doc(ALICE_UID).collection("decks").doc("deck_alice_1");
  await assertSucceeds(deckRef.set({
    title: "Cell Biology",
    subject: "Biology",
    sourceType: "textbook",
    cardCount: 20,
    masteredCount: 5,
    reviewCount: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await assertSucceeds(deckRef.get());
});

test("Alice can create a flashcard in her deck", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const cardRef = aliceDb.collection("users").doc(ALICE_UID).collection("decks").doc("deck_alice_1").collection("cards").doc("card_1");
  await assertSucceeds(cardRef.set({
    deckId: "deck_alice_1",
    question: "What is the powerhouse of the cell?",
    answer: "Mitochondria",
    keyConcept: "Cellular Respiration",
    explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions.",
    difficulty: "easy",
    status: "new",
    reviewInterval: 1,
    repetitions: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
});
