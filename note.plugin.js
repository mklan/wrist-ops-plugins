module.exports = {
  name: 'note',
  description: 'Creates a new note',

  handle: async function(text, context) {
    const note = context.params.note;
    const res = await fetch("https://startpage-api.klanm.at/note", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": context.params.apiKey
      },
      body: JSON.stringify({ payload: note })
    });
    const json = await res.json();

    return { result: 'note created' };
  }
};
