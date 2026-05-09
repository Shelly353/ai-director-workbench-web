window.AI_PROMPTS = window.AI_PROMPTS || {};

window.AI_PROMPTS.scenes = {
    // 🌟 核心：将原本在 HTML 里的硬编码指令移动到这里，并强化禁令
    llmPrompt: "你是一位顶级的动画导演与空间架构师。请为场景【{name}】同时构思『North-正拍』和『South-反拍』的视觉描述。\n\n" +
               "【核心规则】：\n" +
               "1. 纯空镜头：画面必须是纯环境描述，绝对禁止出现任何人物、角色、人群或人体局部。严禁描述角色的动作。\n" +
               "2. 物理对位：必须识别场景的中心物件、左侧（东）物件、右侧（西）物件。严格遵守：North右侧物件在South必须出现在左侧，North左侧物件在South出现在右侧。\n" +
               "3. 表演舞台：画面中心必须预留出一片平坦的开阔地，用于后续合成。描述中严禁提及具体容纳人数。\n" +
               "4. 风格对齐：色彩高饱和、明亮通透。当前风格为：{style}。\n" +
               "5. 视角约束：绝对平视，机位与地面平行。\n\n" +
               "剧本内容：\n{script}\n\n" +
               "请按以下格式输出（不要有其他任何文字）：\nNorth: [正拍描述]\nSouth: [反拍描述]",

    prefix: "( high saturation, cinematic lighting with clear shadows, vibrant and clean colors, high-contrast lighting). Wide-angle Frontal Orthogonal View looking directly North. Absolute eye-level camera, zero tilt, strictly horizontal horizon, no distortion. ",
    suffix: ". Lighting: strictly NO light beams, NO Tyndall effect, NO lens flares, NO visible rays of light. Clean environment, no ruins. --ar 16:9 --no characters --no distortion --no flare, beam, ray, Tyndall, glow",
    ratio: "16:9",
    size: "1920*1080"
};

window.AI_PROMPTS.scenes_reverse = {
    // 保持前缀后缀用于生图，llmPrompt 已集成到上方
    prefix: "(consistent palette and contrast with the North shot). Wide-angle Frontal Orthogonal View looking directly South, 180-degree reverse. Absolute eye-level camera, strictly frontal, zero tilt. ",
    suffix: ". Spatial Map: Perfectly mirroring the objects from the North view. Lighting: Identical color temperature, strictly NO light beams, NO Tyndall effect, NO lens flares. --ar 16:9 --no characters --no distortion --no flare, beam, ray, Tyndall, glow",
    ratio: "16:9",
    size: "1920*1080"
};