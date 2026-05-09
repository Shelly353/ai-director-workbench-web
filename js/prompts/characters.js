window.AI_PROMPTS = window.AI_PROMPTS || {};

window.AI_PROMPTS.characters = {
    // LLM 指令：确保提取的特征极其纯粹，不带任何干扰项
    llmPrompt: "你是一位资深美术指导。请为人物【{name}】提取视觉核心特征，包括：面部细节、发型、具体服装材质和颜色。严禁描述动作和环境。字数控制在50字以内。当前设定风格：{style}。\n\n剧本：\n{script}",
    
    // 前缀：在原有分屏逻辑基础上，深度强化“头部与足部”的完整呈现指令
    prefix: "MANDATORY LAYOUT: One single image divided into 4 EQUAL VERTICAL PANELS. Panel 1: Close-up of facial details. Panel 2: Full body front view. Panel 3: Full body side view. Panel 4: Full body back view. Ensure the head and feet are fully visible and not cropped in every view. All views must be perfectly aligned horizontally. 核心指令：一张图必须严格等分为四个垂直区域。从左到右比例为1:1:1:1，依次必须呈现：1.面部细节特写，2.全身正视图，3.全身侧视图，4.全身背视图。每一个视图必须完整包含从头顶到脚底的全部细节，绝对禁止切断头部或足部，禁止缺少任何视图。特征描述：", 
    
    // 后缀：封死所有可能导致“简化”排版的退路
    suffix: "。Requirements: Solid white background, no text, no reference lines, no watermarks, professional character model sheet, 8k, cinematic lighting. 必须纯白背景，严禁文字，严禁参考线，严禁合并视图。",
    
    // 分辨率：4个视图在 1920 宽度的像素下分配最均匀
    ratio: "16:9",
    size: "1920*1080"
};