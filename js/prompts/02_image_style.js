window.AI_PROMPTS = window.AI_PROMPTS || {};

// 模块一：图像生成的前后缀模板 (Gemini)
window.AI_PROMPTS.imageTemplates = {
    characters: { 
        prefix: "角色设定图，半身人像，极其详细的脸部特征，", 
        suffix: "，8k分辨率，阿莱摄影机拍摄，电影级质感，顶光照明。" 
    },
    scenes: { 
        prefix: "电影场景概念设计，环境空镜头，", 
        suffix: "，广角镜头，体积光，虚幻引擎5渲染，极高画质。" 
    },
    scenes_reverse: { 
        prefix: "电影镜头，反打视角（Reverse shot），越过肩膀看向前方，", 
        suffix: "，前景虚化，背景景深，电影级光影。" 
    },
    props: { 
        prefix: "影视道具设计，独立展示，", 
        suffix: "，摄影棚布光，细节清晰，高质量质感。" 
    },
    effects: { 
        prefix: "特效视觉设计，", 
        suffix: "，酷炫风格，动态模糊，高对比度色彩。" 
    }
};