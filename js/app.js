const API_BASE = "https://proxy-server-web.onrender.com";

// ==========================================
// 🌟 1. 全局云端 Supabase 初始化
// ==========================================
const cloudSupabase = window.supabase ? window.supabase.createClient('https://ywigafhbswrovuhvnkty.supabase.co', 'sb_publishable_A0rzUGADUPuhTod5eU1D1g_8E-d86BQ') : null;

// ==========================================
// 🌟 2. 核心：云端数据库引擎 (彻底替代 IndexedDB)
// ==========================================
const DB = {
    init: async function() {
        console.log("☁️ AI 导演云端数据库已连接！");
    },
    get: async function(key) {
        const userId = localStorage.getItem('userId');
        if (!userId || !cloudSupabase) return null;
        
        const { data, error } = await cloudSupabase
            .from('cloud_kv_store')
            .select('data_value')
            .eq('user_id', userId)
            .eq('data_key', key)
            .single();
            
        if (error || !data) return null;
        return data.data_value;
    },
    set: async function(key, value) {
        const userId = localStorage.getItem('userId');
        if (!userId || !cloudSupabase) {
            console.warn("⚠️ 拦截保存：用户未登录或数据库未连接");
            return;
        }
        
        const { error } = await cloudSupabase
            .from('cloud_kv_store')
            .upsert(
                { user_id: userId, data_key: key, data_value: value, updated_at: new Date() }, 
                { onConflict: 'user_id, data_key' }
            );
            
        if (error) {
            console.error("❌ 云端保存失败:", error);
        } else {
            console.log(`✅ [${key}] 成功同步至云端！`);
        }
    },
    remove: async function(key) {
        const userId = localStorage.getItem('userId');
        if (!userId || !cloudSupabase) return;
        await cloudSupabase.from('cloud_kv_store').delete().eq('user_id', userId).eq('data_key', key);
    }
};

// 确保全局都可以访问到云端的 DB
window.DB = DB;

// ==========================================
// 🌟 3. 媒体云盘引擎 (处理图片/视频永久保存)
// ==========================================
window.uploadMediaToCloud = async function(source, fileExt = 'png') {
    const userId = localStorage.getItem('userId');
    if (!userId || !cloudSupabase) throw new Error("用户未登录");
    
    // 如果已经是咱们自己云盘的永久链接，直接放行
    if (typeof source === 'string' && source.includes('supabase.co')) return source;

    try {
        let fileData;
        let finalExt = fileExt;

        // 自动识别是文件对象、Base64 还是外部临时 URL
        if (source instanceof File) {
            fileData = source;
            finalExt = source.name.split('.').pop() || 'png';
        } else if (typeof source === 'string') {
            if (source.startsWith('data:image') || source.startsWith('http')) {
                const res = await fetch(source);
                fileData = await res.blob();
            } else {
                return source; 
            }
        } else {
            return source;
        }

        // 生成专属文件名并上传至 user_media
        const fileName = `${userId}/${Date.now()}_${Math.floor(Math.random()*1000)}.${finalExt}`;
        const { data, error } = await cloudSupabase.storage
            .from('user_media')
            .upload(fileName, fileData, { upsert: true });
            
        if (error) throw error;
        
        // 拿到永久公共 URL
        const { data: publicUrlData } = cloudSupabase.storage.from('user_media').getPublicUrl(fileName);
        console.log(`☁️ 媒体文件已安全入云:`, publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
        
    } catch (e) {
        console.error("上传云盘失败:", e);
        return source instanceof File ? "" : source; // 失败保底返回
    }
};

// ==========================================
// 🌟 4. 全局 API 请求封装
// ==========================================
// app.js 中的全家 API 请求中心
async function apiRequest(endpoint, body) {
    try {
        const userToken = localStorage.getItem('userToken'); // 🌟 从口袋里拿出登录时发的通行证
        
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${userToken}` // 🌟 必须改成这行，发送真 Token
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        return await res.json();
    } catch (e) {
        log(`❌ API 请求失败: ${e.message}`);
        throw e;
    }
}

// 底部日志打印功能
function log(msg) {
    const consoleEl = document.getElementById('logConsole');
    if (consoleEl) {
        const time = new Date().toLocaleTimeString();
        consoleEl.innerText += `[${time}] ${msg}\n`;
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
}

// 全局上传图片功能
let fileUploadCallback = null;
function triggerUpload(callback) {
    fileUploadCallback = callback;
    let uploader = document.getElementById('globalFileUploader');
    if (!uploader) {
        uploader = document.createElement('input');
        uploader.type = 'file';
        uploader.id = 'globalFileUploader';
        uploader.accept = 'image/*';
        uploader.style.display = 'none';
        document.body.appendChild(uploader);
        
        uploader.addEventListener('change', function(e) {
            if (e.target.files[0]) {
                const r = new FileReader();
                r.onload = (ev) => {
                    if (fileUploadCallback) fileUploadCallback(ev.target.result);
                    uploader.value = ""; 
                };
                r.readAsDataURL(e.target.files[0]);
            }
        });
    }
    uploader.click();
}

// ==========================================
// 💎 全局充值收银台模块
// ==========================================

window.showRechargeModal = function() {
    // 如果已经存在，直接显示
    if (document.getElementById('rechargeModal')) {
        document.getElementById('rechargeModal').style.display = 'flex';
        return;
    }

    // 动态生成优美的充值弹窗 UI
    const modalHTML = `
    <div id="rechargeModal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:99999; justify-content:center; align-items:center; backdrop-filter:blur(3px);">
        <div style="background:#fff; width:400px; border-radius:12px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.2); font-family:sans-serif;">
            
            <div style="background:#f4f5f9; padding:15px 20px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e6eb;">
                <h3 style="margin:0; font-size:16px; color:#1d2129;">💎 获取更多积分</h3>
                <span style="font-size:20px; color:#86909c; cursor:pointer; line-height:1;" onclick="document.getElementById('rechargeModal').style.display='none'">×</span>
            </div>

            <div style="padding:20px;">
                <div style="font-size:13px; color:#86909c; margin-bottom:10px;">选择超值套餐：</div>
                
                <div id="pkg-list" style="display:flex; flex-direction:column; gap:10px;">
                    <label style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border:2px solid var(--primary); border-radius:8px; cursor:pointer; background:#f0f7ff;">
                        <div>
                            <input type="radio" name="payPkg" value="pkg_1" checked style="margin-right:10px;">
                            <span style="font-weight:bold; color:#1d2129;">100 💎</span>
                        </div>
                        <div style="color:var(--primary); font-weight:bold;">￥9.9</div>
                    </label>

                    <label style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border:1px solid #e5e6eb; border-radius:8px; cursor:pointer;">
                        <div>
                            <input type="radio" name="payPkg" value="pkg_2" style="margin-right:10px;">
                            <span style="font-weight:bold; color:#1d2129;">500 💎 <span style="font-size:11px; background:#f53f3f; color:#fff; padding:2px 4px; border-radius:4px; margin-left:5px;">热门</span></span>
                        </div>
                        <div style="color:var(--primary); font-weight:bold;">￥39.9</div>
                    </label>

                    <label style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px; border:1px solid #e5e6eb; border-radius:8px; cursor:pointer;">
                        <div>
                            <input type="radio" name="payPkg" value="pkg_3" style="margin-right:10px;">
                            <span style="font-weight:bold; color:#1d2129;">1000 💎</span>
                        </div>
                        <div style="color:var(--primary); font-weight:bold;">￥69.9</div>
                    </label>
                </div>

                <div style="margin-top:20px; font-size:13px; color:#86909c; margin-bottom:10px;">选择支付方式：</div>
                <div style="display:flex; gap:10px;">
                    <button id="btnAlipay" onclick="selectPayMethod('alipay')" style="flex:1; padding:10px; border:2px solid #1677FF; background:#f0f7ff; color:#1677FF; border-radius:8px; cursor:pointer; font-weight:bold;">🟦 支付宝</button>
                    <button id="btnWechat" onclick="selectPayMethod('wechat')" style="flex:1; padding:10px; border:1px solid #e5e6eb; background:#fff; color:#00b42a; border-radius:8px; cursor:pointer; font-weight:bold;">🟩 微信支付</button>
                </div>

                <div id="qrCodeArea" style="display:none; margin-top:20px; text-align:center; padding-top:15px; border-top:1px dashed #e5e6eb;">
                    <div style="font-size:12px; color:#86909c; margin-bottom:10px;">请使用 <span id="qrPayName" style="color:var(--primary); font-weight:bold;">支付工具</span> 扫码付款</div>
                    <img id="qrCodeImg" src="" style="width:150px; height:150px; border:1px solid #eee; border-radius:8px; padding:5px;">

          //模拟付款只在测试时使用，上线后删除。          
                    <div style="margin-top:15px;">
                        <button class="btn btn-primary" onclick="mockPaymentSuccess()" style="width:100%; padding:10px; border-radius:20px;">🧪 (测试通道) 模拟付款成功</button>
                    </div>
                </div>
          //模拟付款只在测试时使用，上线后删除。  
        
                <button id="btnCreateOrder" class="btn btn-primary" style="width:100%; margin-top:20px; padding:12px; font-size:14px; border-radius:8px;" onclick="initiatePayment()">立即充值</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 为单选框添加简单的选中样式切换
    const radios = document.querySelectorAll('input[name="payPkg"]');
    radios.forEach(r => {
        r.addEventListener('change', function() {
            radios.forEach(rb => { rb.parentElement.parentElement.style.border = '1px solid #e5e6eb'; rb.parentElement.parentElement.style.background = '#fff'; });
            this.parentElement.parentElement.style.border = '2px solid var(--primary)';
            this.parentElement.parentElement.style.background = '#f0f7ff';
        });
    });
};

// 当前选中的支付方式 (默认支付宝)
window.currentPayMethod = 'alipay';
window.currentOrderId = null;

window.selectPayMethod = function(method) {
    window.currentPayMethod = method;
    document.getElementById('btnAlipay').style.border = method === 'alipay' ? '2px solid #1677FF' : '1px solid #e5e6eb';
    document.getElementById('btnAlipay').style.background = method === 'alipay' ? '#f0f7ff' : '#fff';
    document.getElementById('btnWechat').style.border = method === 'wechat' ? '2px solid #00b42a' : '1px solid #e5e6eb';
    document.getElementById('btnWechat').style.background = method === 'wechat' ? '#f0ffec' : '#fff';
};

window.initiatePayment = async function() {
    const pkg = document.querySelector('input[name="payPkg"]:checked').value;
    const btn = document.getElementById('btnCreateOrder');
    
    btn.innerText = '正在生成安全订单...';
    btn.disabled = true;

    try {
        const res = await apiRequest('/api/pay/create-order', { packageId: pkg, payMethod: window.currentPayMethod });
        
        if(res.success) {
            window.currentOrderId = res.orderId;
            document.getElementById('btnCreateOrder').style.display = 'none';
            document.getElementById('qrCodeArea').style.display = 'block';
            document.getElementById('qrCodeImg').src = res.qrCodeUrl;
            document.getElementById('qrPayName').innerText = window.currentPayMethod === 'alipay' ? '支付宝' : '微信';
        }
    } catch (e) {
        alert("订单创建失败: " + e.message);
        btn.innerText = '立即充值';
        btn.disabled = false;
    }
};

window.mockPaymentSuccess = async function() {
    if(!window.currentOrderId) return;
    try {
        // 调用我们预留的模拟回调接口
        const res = await apiRequest('/api/pay/mock-success', { orderId: window.currentOrderId });
        if(res.success) {
            alert(`🎉 充值成功！您的最新积分为: ${res.newCredits} 💎`);
            document.getElementById('rechargeModal').style.display = 'none';
            // 刷新页面顶部的积分显示
            const headerCredit = document.getElementById('headerCredit');
            if(headerCredit) headerCredit.innerText = `💎 ${res.newCredits}`;
            localStorage.setItem('userCredits', res.newCredits);
            
            // 恢复弹窗初始状态，方便下次点开
            document.getElementById('btnCreateOrder').style.display = 'block';
            document.getElementById('btnCreateOrder').disabled = false;
            document.getElementById('btnCreateOrder').innerText = '立即充值';
            document.getElementById('qrCodeArea').style.display = 'none';
        }
    } catch(e) {
        alert("支付回调异常: " + e.message);
    }
};