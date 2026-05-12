var API_BASE = "https://proxy-server-web.onrender.com";

// 🌟 全局唯一数据库实例
window.cloudSupabase = window.supabase ? window.supabase.createClient('https://ywigafhbswrovuhvnkty.supabase.co', 'sb_publishable_A0rzUGADUPuhTod5eU1D1g_8E-d86BQ') : null;

var DB = {
    init: async function() {
        console.log("☁️ AI 导演云端数据库已连接！");
    },
    
    _getUid: async function() {
        let uid = localStorage.getItem('userId');
        if (uid && uid !== "undefined") return uid;
        
        if (window.cloudSupabase) {
            const { data } = await window.cloudSupabase.auth.getSession();
            if (data && data.session && data.session.user) {
                const recoveredId = data.session.user.id;
                localStorage.setItem('userId', recoveredId);
                return recoveredId;
            }
        }
        return null;
    },

    get: async function(key) {
        const userId = await this._getUid();
        if (!userId || !window.cloudSupabase) return null;
        
        // 🌟 终极修复：使用 limit(1) 取代 single()，彻底消灭 406 报错！
        const { data, error } = await window.cloudSupabase
            .from('cloud_kv_store')
            .select('data_value')
            .eq('user_id', userId)
            .eq('data_key', key)
            .limit(1);
            
        if (error || !data || data.length === 0) return null;
        return data[0].data_value;
    },

    set: async function(key, value) {
        const userId = await this._getUid();
        if (!userId || !window.cloudSupabase) {
            console.warn("⚠️ 拦截保存：未检测到身份");
            return;
        }
        
        const { error } = await window.cloudSupabase.from('cloud_kv_store').upsert(
            { user_id: userId, data_key: key, data_value: value, updated_at: new Date() }, 
            { onConflict: 'user_id, data_key' }
        );
        if (error) console.error("❌ 云端保存失败:", error);
        else console.log(`✅ [${key}] 同步成功`);
    },

    remove: async function(key) {
        const userId = await this._getUid();
        if (!userId || !window.cloudSupabase) return;
        await window.cloudSupabase.from('cloud_kv_store').delete().eq('user_id', userId).eq('data_key', key);
    }
};

window.DB = DB;

window.uploadMediaToCloud = async function(source, fileExt = 'png') {
    const userId = await DB._getUid();
    if (!userId || !window.cloudSupabase) throw new Error("用户未登录");
    if (typeof source === 'string' && source.includes('supabase.co')) return source;
    try {
        let fileData, finalExt = fileExt;
        if (source instanceof File) { fileData = source; finalExt = source.name.split('.').pop() || 'png'; } 
        else if (typeof source === 'string') {
            if (source.startsWith('data:image') || source.startsWith('http')) { const res = await fetch(source); fileData = await res.blob(); } 
            else return source; 
        } else return source;

        const fileName = `${userId}/${Date.now()}_${Math.floor(Math.random()*1000)}.${finalExt}`;
        const { error } = await window.cloudSupabase.storage.from('user_media').upload(fileName, fileData, { upsert: true });
        if (error) throw error;
        
        const { data: publicUrlData } = window.cloudSupabase.storage.from('user_media').getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    } catch (e) {
        console.error("上传云盘失败:", e);
        return source instanceof File ? "" : source;
    }
};

async function apiRequest(endpoint, body) {
    try {
        let validToken = "";
        if (typeof window.cloudSupabase !== 'undefined') {
            const { data: { session }, error } = await window.cloudSupabase.auth.getSession();
            if (error || !session) throw new Error("登录已失效");
            validToken = session.access_token;
            localStorage.setItem('userToken', validToken); 
        } else {
            validToken = localStorage.getItem('userToken');
        }
        
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${validToken}` },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return await res.json();
    } catch (e) {
        if (typeof log === 'function') log(`❌ API 请求失败: ${e.message}`);
        throw e;
    }
}

function log(msg) { const c = document.getElementById('logConsole'); if(c){ c.innerText += `[${new Date().toLocaleTimeString()}] ${msg}\n`; c.scrollTop = c.scrollHeight; } }

var fileUploadCallback = null;
function triggerUpload(callback) {
    fileUploadCallback = callback; let u = document.getElementById('globalFileUploader');
    if (!u) { 
        u = document.createElement('input'); u.type = 'file'; u.id = 'globalFileUploader'; u.accept = 'image/*'; u.style.display = 'none'; 
        document.body.appendChild(u); 
        u.addEventListener('change', function(e) { 
            if (e.target.files[0]) { 
                const r = new FileReader(); 
                r.onload = (ev) => { if (fileUploadCallback) fileUploadCallback(ev.target.result); u.value = ""; }; 
                r.readAsDataURL(e.target.files[0]); 
            } 
        }); 
    } 
    u.click();
}

window.showRechargeModal = function() {
    if (document.getElementById('rechargeModal')) { document.getElementById('rechargeModal').style.display = 'flex'; return; }
    // 简化的充值弹窗（保留您的核心逻辑）
    const modalHTML = `<div id="rechargeModal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; justify-content:center; align-items:center;"><div style="background:#fff; width:400px; padding:20px; border-radius:12px;"><h3 style="margin-top:0;">💎 获取积分 <span style="float:right; cursor:pointer;" onclick="document.getElementById('rechargeModal').style.display='none'">×</span></h3><button class="btn btn-primary" style="width:100%" onclick="alert('测试环境：功能就绪')">测试充值</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};
