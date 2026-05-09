window.AI_PROMPTS = window.AI_PROMPTS || {};

window.AI_PROMPTS.props = {
    // 🌟 LLM 指令：保持原有逻辑
    llmPrompt: "你是一位资深的电影美术指导。请根据以下剧本内容，为关键道具【{name}】写一段纯视觉的材质、大小、颜色、磨损程度的描述，用于AI绘图。不要超过80字，只输出纯描述文字。当前设定风格：{style}。\n\n剧本内容：\n{script}",
    
    // 🌟 前缀与后缀：保持原有逻辑
    prefix: "",
    suffix: "，纯白色背景，不要主体外的参照物，背景不要有白色外的其他颜色，不要出现文字，不要出现特效。",
    
    // 🌟 比例修改：设定为 1:1 正方形
    ratio: "1:1",
    size: "1024*1024" 
};