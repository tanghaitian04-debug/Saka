(function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    var number = Number(value);
    if (!Number.isFinite(number)) number = 0;
    return Math.min(max, Math.max(min, number));
  }

  function getByPath(object, path) {
    return String(path).split(".").reduce(function (current, key) {
      return current == null ? undefined : current[key];
    }, object);
  }

  function checkRequirement(state, requirement) {
    var actual = getByPath(state, requirement.path);
    var expected = requirement.value;
    switch (requirement.op) {
      case "eq": return actual === expected;
      case "neq": return actual !== expected;
      case "gte": return Number(actual) >= Number(expected);
      case "lte": return Number(actual) <= Number(expected);
      case "gt": return Number(actual) > Number(expected);
      case "lt": return Number(actual) < Number(expected);
      case "contains": return Array.isArray(actual) && actual.indexOf(expected) !== -1;
      case "notContains": return !Array.isArray(actual) || actual.indexOf(expected) === -1;
      default: return true;
    }
  }

  function requirementsMet(state, requirements) {
    return (requirements || []).every(function (requirement) {
      return checkRequirement(state, requirement);
    });
  }

  function create(chapterId, identityId, personaId, data) {
    var identity = data.identities.find(function (item) { return item.id === identityId; });
    var persona = identity.personas.find(function (item) { return item.id === personaId; }) || identity.personas[0];
    var chapter = data.chapters.find(function (item) { return item.id === chapterId; });
    var relationships = {};
    var characterStates = {};

    data.characters.forEach(function (character) {
      relationships[character.id] = character.initialTrust || 0;
      characterStates[character.id] = { alive: true, injured: false, missing: false, status: "未同行" };
    });

    return {
      version: 2,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      playSeconds: 0,
      themeId: chapter.themeId,
      chapterId: chapterId,
      chapterOrder: chapter.order,
      stage: 1,
      currentEventId: null,
      stageStartEventId: null,
      identityId: identityId,
      personaId: persona.id,
      personaName: persona.name,
      stats: {
        hp: identity.initial.hp,
        mental: identity.initial.mental,
        supplies: identity.initial.supplies,
        trust: identity.initial.trust,
        rescueScore: 0,
        evidence: 0
      },
      specialty: clone(identity.specialty),
      relationships: relationships,
      characterStates: characterStates,
      flags: {},
      inventory: [],
      unlockedMemories: [],
      unlockedSources: [],
      visitedEvents: [],
      enteredEvents: [],
      choices: [],
      consequences: [],
      completedStages: [],
      endingId: null,
      failureContext: null
    };
  }

  function describeDelta(key, before, after) {
    var names = { hp: "血量", mental: "精神", supplies: "物资", rescueScore: "救援", evidence: "证据" };
    var delta = Number(after) - Number(before);
    if (!delta) return null;
    return { key: key, label: names[key] || key, delta: delta, before: before, after: after };
  }

  function applyEffects(state, effects, reason) {
    effects = effects || {};
    var changes = [];
    ["hp", "mental", "supplies", "rescueScore", "evidence"].forEach(function (key) {
      if (typeof effects[key] !== "number") return;
      var before = Number(state.stats[key] || 0);
      var after = before + effects[key];
      if (key === "hp" || key === "mental") after = clamp(after, 0, 100);
      else after = Math.max(0, after);
      state.stats[key] = after;
      var change = describeDelta(key, before, after);
      if (change) changes.push(change);
    });

    var specialtyEffects = effects.specialty || effects.specialtyEffects || {};
    Object.keys(specialtyEffects).forEach(function (key) {
      var before = Number(state.specialty[key] || 0);
      var after = Math.max(0, before + Number(specialtyEffects[key] || 0));
      state.specialty[key] = after;
      if (after !== before) changes.push({ key: key, label: key, delta: after - before, before: before, after: after });
    });

    var trustEffects = effects.trust || {};
    Object.keys(trustEffects).forEach(function (characterId) {
      var before = Number(state.relationships[characterId] || 0);
      state.relationships[characterId] = clamp(before + Number(trustEffects[characterId] || 0), -100, 100);
      changes.push({ key: characterId, label: "信任", delta: state.relationships[characterId] - before, before: before, after: state.relationships[characterId] });
    });

    var flags = effects.flags || {};
    Object.keys(flags).forEach(function (flag) { state.flags[flag] = flags[flag]; });
    (effects.setFlags || []).forEach(function (flag) { state.flags[flag] = true; });
    (effects.clearFlags || []).forEach(function (flag) { delete state.flags[flag]; });
    (effects.addItems || []).forEach(function (itemId) {
      if (state.inventory.indexOf(itemId) === -1) state.inventory.push(itemId);
      if (state.unlockedMemories.indexOf(itemId) === -1) state.unlockedMemories.push(itemId);
    });
    (effects.removeItems || []).forEach(function (itemId) {
      state.inventory = state.inventory.filter(function (id) { return id !== itemId; });
    });
    (effects.addMemories || []).forEach(function (itemId) {
      if (state.unlockedMemories.indexOf(itemId) === -1) state.unlockedMemories.push(itemId);
    });

    var characterEffects = effects.characterStates || {};
    Object.keys(characterEffects).forEach(function (characterId) {
      state.characterStates[characterId] = Object.assign(
        {},
        state.characterStates[characterId] || { alive: true, injured: false, missing: false, status: "未知" },
        characterEffects[characterId]
      );
    });

    if (changes.length) {
      state.consequences.push({ at: Date.now(), reason: reason || "事件影响", changes: clone(changes) });
    }
    state.updatedAt = Date.now();
    return changes;
  }

  function applyChoice(state, choice, event) {
    var combined = Object.assign({}, choice.effects || {});
    combined.setFlags = (combined.setFlags || []).concat(choice.setFlags || []);
    combined.addItems = (combined.addItems || []).concat(choice.addItems || []);
    combined.addMemories = (combined.addMemories || []).concat(choice.addMemories || []);
    combined.removeItems = (combined.removeItems || []).concat(choice.removeItems || []);
    if (choice.specialtyEffects) combined.specialtyEffects = choice.specialtyEffects;
    var changes = applyEffects(state, combined, event.title + " · " + choice.text);
    state.choices.push({
      eventId: event.id,
      choiceId: choice.id,
      choiceText: choice.text,
      result: choice.result,
      stage: event.stage,
      at: Date.now()
    });
    return changes;
  }

  function selectEnding(state, endings) {
    var chapterEndings = endings.filter(function (ending) { return ending.chapterId === state.chapterId; });
    if (state.stats.hp <= 0) {
      return chapterEndings.find(function (ending) { return ending.tier === "failure"; }) || chapterEndings[0];
    }
    var priority = ["hidden", "good", "wounded", "bittersweet", "survival"];
    for (var i = 0; i < priority.length; i += 1) {
      var match = chapterEndings.find(function (ending) {
        return ending.tier === priority[i] && requirementsMet(state, ending.requirements);
      });
      if (match) return match;
    }
    return chapterEndings.find(function (ending) { return requirementsMet(state, ending.requirements); }) || chapterEndings[0];
  }

  window.ChengshangState = {
    clone: clone,
    clamp: clamp,
    getByPath: getByPath,
    requirementsMet: requirementsMet,
    create: create,
    applyEffects: applyEffects,
    applyChoice: applyChoice,
    selectEnding: selectEnding
  };
}());
