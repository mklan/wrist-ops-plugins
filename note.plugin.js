module.exports = {
  name: 'note',
  description: 'Creates a new note',

  handle: async function(text, context) {
    const res = await fetch("https://startpage-api.klanm.at/note", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": context.params.apiKey
      },
      body: JSON.stringify({ payload: context.params.note })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Note API error ${res.status}: ${errBody}`);
    }

    return { result: 'note created' };
  }
};
