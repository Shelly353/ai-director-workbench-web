var API_BASE = "https://proxy-server-web.onrender.com";

// 🌟 核心修复 1：把公钥光明正大地写在前端，这是唯一正确的做法，并通过 window 暴露给所有 HTML
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
        
        // 🌟 终极杀招：使用 .limit(1) 取代 .single()，即使没有数据也会返回 200 OK 的空数组，绝不报 406！
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
async function apiRequest(endpoint, body) {
    try {
        const baseURL = typeof API_BASE !== 'undefined' ? API_BASE : 'https://proxy-server-web.onrender.com';
        
        let validToken = "";

        if (typeof supabaseClient !== 'undefined') {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error || !session) throw new Error("本地登录已失效，请退出重新登录！");
            validToken = session.access_token;
            localStorage.setItem('userToken', validToken); 
        } else {
            validToken = localStorage.getItem('userToken');
        }
        
        const res = await fetch(`${baseURL}${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${validToken}` 
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        
        return await res.json();
    } catch (e) {
        if (typeof log === 'function') log(`❌ API 请求失败: ${e.message}`);
        console.error(e);
        throw e;
    }
}

function log(msg) {
    const consoleEl = document.getElementById('logConsole');
    if (consoleEl) {
        const time = new Date().toLocaleTimeString();
        consoleEl.innerText += `[${time}] ${msg}\n`;
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
}

var fileUploadCallback = null;
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
    if (document.getElementById('rechargeModal')) {
        document.getElementById('rechargeModal').style.display = 'flex';
        return;
    }

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
         
                    <div style="margin-top:15px;">
                        <button class="btn btn-primary" onclick="mockPaymentSuccess()" style="width:100%; padding:10px; border-radius:20px;">🧪 (测试通道) 模拟付款成功</button>
                    </div>
                </div>
        
                <button id="btnCreateOrder" class="btn btn-primary" style="width:100%; margin-top:20px; padding:12px; font-size:14px; border-radius:8px;" onclick="initiatePayment()">立即充值</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const radios = document.querySelectorAll('input[name="payPkg"]');
    radios.forEach(r => {
        r.addEventListener('change', function() {
            radios.forEach(rb => { rb.parentElement.parentElement.style.border = '1px solid #e5e6eb'; rb.parentElement.parentElement.style.background = '#fff'; });
            this.parentElement.parentElement.style.border = '2px solid var(--primary)';
            this.parentElement.parentElement.style.background = '#f0f7ff';
        });
    });
};

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
        const res = await apiRequest('/api/pay/mock-success', { orderId: window.currentOrderId });
        if(res.success) {
            alert(`🎉 充值成功！您的最新积分为: ${res.newCredits} 💎`);
            document.getElementById('rechargeModal').style.display = 'none';
            const headerCredit = document.getElementById('headerCredit');
            if(headerCredit) headerCredit.innerText = `💎 ${res.newCredits}`;
            localStorage.setItem('userCredits', res.newCredits);
            
            document.getElementById('btnCreateOrder').style.display = 'block';
            document.getElementById('btnCreateOrder').disabled = false;
            document.getElementById('btnCreateOrder').innerText = '立即充值';
            document.getElementById('qrCodeArea').style.display = 'none';
        }
    } catch(e) {
        alert("支付回调异常: " + e.message);
    }
};