window.AI_PROMPTS = window.AI_PROMPTS || {};

window.AI_PROMPTS.effects = {
    llmPrompt: "你是一位资深的特效总监（VFX Supervisor）。请根据以下剧本内容，为特效【{name}】写一段视觉表现力的描述（如粒子形态、发光颜色、动态感）。不要超过80字，只输出纯描述文字。\n\n剧本内容：\n{script}",
    prefix: "",
    suffix: "，纯白色背景，不要主体外的参照物，背景不要有白色外的其他颜色，不要出现文字。", // ✅ 补上这个救命的英文逗号
    ratio: "1:1",
    size: "1024*1024"
};
