class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single">
            单人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi">
            玩法介绍
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            设置
        </div>
    </div>
</div>
`);
        this.root.$ac_game.append(this.$menu); 
        this.$single = this.$menu.find('.ac-game-menu-field-item-single');
        this.$multi = this.$menu.find('.ac-game-menu-field-item-multi');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');
        
        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single.click(function() { 
            outer.hide();
            outer.root.playground.show();
        });

        this.$multi.click(function() {
            console.log("玩法介绍");
            outer.hide();
            outer.root.intro.show();
        });

        this.$settings.click(function() {
            console.log("设置");
            outer.hide();
            outer.root.settings.show();  // 显示设置界面
        });
    }

    show() {
        this.$menu.show();
    }
    hide() {
        this.$menu.hide();
    } 
}

class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`);
        this.root.$ac_game.append(this.$playground); 
        
        // 先隐藏
        this.hide();
        
        // 标记是否已初始化
        this.initialized = false;
        
        // 毒圈相关属性 - 先初始化为null
        this.safe_zone = null;
        this.zone_center = { x: 0, y: 0 };
        this.zone_initial_radius = 0;
        this.zone_final_radius = 0;
        this.zone_shrink_duration = 30000;  // 缩圈持续时间（毫秒）
        this.zone_shrink_delay = 10000;      // 开始缩圈前的等待时间（毫秒）
        this.zone_damage = 1.3;               // 毒圈每秒伤害
        this.game_start_time = null;
    }
    
    init_game() {
        if (this.initialized) return;
        
        setTimeout(() => {
            this.width = this.$playground.width();
            this.height = this.$playground.height();
            
            console.log('Playground 大小:', this.width, this.height);
            
            this.game_map = new GameMap(this);
            this.players = [];
            
            // 先创建安全区（在玩家之前）
            this.init_safe_zone();
            console.log('安全区创建完成:', this.safe_zone);
            
            // 创建主玩家
            let player = new Player(
                this,
                this.width / 2,
                this.height / 2,
                this.height * 0.05,
                "white",
                this.height * 0.2,
                true
            );
            this.players.push(player);
            
            console.log('玩家创建成功', player);
            
            // 创建敌人
            for(let i = 0; i < 6; i++) {
                let random_x = Math.random() * this.width;
                let random_y = Math.random() * this.height;
                let random_color = `rgb(${Math.random()*256},${Math.random()*256},${Math.random()*256})`;
                
                this.players.push(new Player(
                    this,
                    random_x,
                    random_y,
                    this.height * 0.05,
                    random_color,
                    this.height * 0.2,
                    false
                ));
            }
            
            this.initialized = true;
            this.game_start_time = Date.now();
            console.log('游戏开始时间:', this.game_start_time);
        }, 100);
    }
    
    // 初始化安全区
    init_safe_zone() {
        // 安全区中心在场地中心
        this.zone_center = {
            x: this.width / 2,
            y: this.height / 2
        };
        
        let max_distance = Math.sqrt(
            Math.pow(this.width / 2, 2) + 
            Math.pow(this.height / 2, 2)
        );
        
        // 初始安全区半径设置为最大距离的 1.2 倍，确保全屏覆盖
        this.zone_initial_radius = max_distance;
        
        // 最终安全区半径为场地宽度的 10%
        this.zone_final_radius = Math.min(this.width, this.height) * 0.3;
        
        // 创建安全区对象
        this.safe_zone = new SafeZone(this);
        
        console.log('安全区初始化:', {
            center: this.zone_center,
            initial_radius: this.zone_initial_radius,
            final_radius: this.zone_final_radius,
            safe_zone: this.safe_zone
        });
    }
    
    // 获取当前安全区半径
    get_current_zone_radius() {
        if (!this.game_start_time) {
            console.log('游戏未开始，返回初始半径');
            return this.zone_initial_radius;
        }
        
        let current_time = Date.now();
        let time_since_start = current_time - this.game_start_time;
        
        // 如果还没到开始缩小的时间
        if (time_since_start < this.zone_shrink_delay) {
            return this.zone_initial_radius;
        }
        
        // 计算缩小进度
        let shrink_time = Math.min(time_since_start - this.zone_shrink_delay, this.zone_shrink_duration);
        let progress = shrink_time / this.zone_shrink_duration;
        
        // 如果缩小完成
        if (progress >= 1) {
            return this.zone_final_radius;
        }
        
        // 线性插值计算当前半径
        return this.zone_initial_radius - (this.zone_initial_radius - this.zone_final_radius) * progress;
    }
    
    // 检查点是否在安全区内
    is_point_in_safe_zone(x, y) {
        let current_radius = this.get_current_zone_radius();
        let dx = x - this.zone_center.x;
        let dy = y - this.zone_center.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= current_radius;
    }
    
    show() {
        this.$playground.show();
        if (!this.initialized) {
            this.init_game();
        }
    }
    
    hide() {
        this.$playground.hide();
    }
}

class AcGameIntro {
    constructor(root) {
        this.root = root;
        this.$intro = $(`
            <div class="ac-game-intro">
                <div class="intro-content">
                    <h1 class="intro-title">玩法介绍</h1>
                    
                    <div class="intro-text">
                        <h2>基本操作</h2>
                        <p>鼠标右键：移动角色</p>
                        <p>鼠标左键：发射普通攻击</p>
                        
                        <h2>技能系统(有冷却CD)</h2>
                        <p>空格键：加速移动</p>
                        <p>Q键 + 左键：火球术（高伤害）</p>
                        <p>W键 + 左键：冰球术（减速效果）</p>
                        <p>E键 + 左键：炸弹（范围爆炸）</p>
                        <p>S键 + 左键：箭矢（连续射击）</p>
                        
                        <h2>游戏目标</h2>
                        <p>消灭所有敌人，生存下来！</p>
                        <p>敌人会随机移动并向你发起攻击！</p>
                    </div>
                    
                    <button class="intro-back-btn">返回菜单</button>
                </div>
            </div>
        `);
        
        this.root.$ac_game.append(this.$intro); 
        
        // 绑定返回按钮事件
        this.$intro.find('.intro-back-btn').click(() => {
            this.back_to_menu();
        });
        
        this.hide();
    }
    
    show() {
        this.$intro.show();
    }
    
    hide() {
        this.$intro.hide();
    }
    
    back_to_menu() {
        this.hide();
        this.root.menu.show();
    }

}
class AcGameSettings {
    constructor(root) {
        this.root = root;
        this.$settings = $(`
            <div class="ac-game-settings">
                <div class="settings-content">
                    <h1 class="settings-title">游戏设置</h1>
                    
                    <div class="settings-section">
                        <h2>难度选择</h2>
                        <div class="difficulty-options">
                            <div class="difficulty-option" data-difficulty="easy">
                                <span class="difficulty-name">简单</span>
                                <span class="difficulty-desc">敌人射击间隔较长，适合新手</span>
                            </div>
                            <div class="difficulty-option" data-difficulty="medium">
                                <span class="difficulty-name">中等</span>
                                <span class="difficulty-desc">正常的游戏体验</span>
                            </div>
                            <div class="difficulty-option" data-difficulty="hard">
                                <span class="difficulty-name">困难</span>
                                <span class="difficulty-desc">敌人射击频繁，挑战你的反应</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-buttons">
                        <button class="settings-save-btn">保存设置</button>
                        <button class="settings-back-btn">返回菜单</button>
                    </div>
                </div>
            </div>
        `);
        
        this.root.$ac_game.append(this.$settings);
        
        // 当前选中的难度
        this.current_difficulty = 'medium';
        
        // 绑定事件
        this.bind_events();
        
        this.hide();
    }
    
    bind_events() {
        // 难度选项点击事件
        this.$settings.find('.difficulty-option').click((e) => {
            let $option = $(e.currentTarget);
            let difficulty = $option.data('difficulty');
            
            // 移除其他选项的选中状态
            this.$settings.find('.difficulty-option').removeClass('selected');
            // 添加当前选项的选中状态
            $option.addClass('selected');
            
            this.current_difficulty = difficulty;
            console.log('选择难度:', difficulty);
        });
        
        // 保存按钮
        this.$settings.find('.settings-save-btn').click(() => {
            this.save_settings();
        });
        
        // 返回菜单按钮
        this.$settings.find('.settings-back-btn').click(() => {
            this.back_to_menu();
        });
    }
    
    save_settings() {
        console.log('保存设置，难度:', this.current_difficulty);
        
        // 根据难度设置敌人射击间隔
        let shoot_cooldown_range;
        switch(this.current_difficulty) {
            case 'easy':
                shoot_cooldown_range = { min: 480, max: 720 }; // 8-12秒
                break;
            case 'medium':
                shoot_cooldown_range = { min: 240, max: 480 }; // 4-8秒
                break;
            case 'hard':
                shoot_cooldown_range = { min: 120, max: 240 }; // 2-4秒
                break;
            default:
                shoot_cooldown_range = { min: 240, max: 480 };
        }
        
        // 保存设置到 root 对象，供游戏使用
        this.root.settings = {
            difficulty: this.current_difficulty,
            shoot_cooldown_range: shoot_cooldown_range
        };
        
        // 提示保存成功
        alert('设置已保存！');
    }
    
    back_to_menu() {
        this.hide();
        this.root.menu.show();
    }
    
    show() {
        this.$settings.show();
        
        // 显示时高亮当前选中的难度
        this.$settings.find('.difficulty-option').removeClass('selected');
        this.$settings.find(`.difficulty-option[data-difficulty="${this.current_difficulty}"]`).addClass('selected');
    }
    
    hide() {
        this.$settings.hide();
    }
}
let AC_GAME_OBJECT = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECT.push(this);
        this.has_called_start = false;
        this.timedelta = 0;
    }
    
    start() {
    }
    
    update() {
    }
    
    on_destroy() {
    }
    
    destroy() {
        this.on_destroy();
        for(let i = 0; i < AC_GAME_OBJECT.length; i++) {
            if(AC_GAME_OBJECT[i] === this) {
                AC_GAME_OBJECT.splice(i, 1);
                break;
            }
        }
    }
}

let last_timestamp = 0;
let AC_GAME_ANIMATION = function(timestamp) {
    for(let i = 0; i < AC_GAME_OBJECT.length; i++) {
        let obj = AC_GAME_OBJECT[i];
        if(!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = timestamp;
    requestAnimationFrame(AC_GAME_ANIMATION);
}
requestAnimationFrame(AC_GAME_ANIMATION);

class SafeZone extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        
        // 安全检查
        if (!this.playground || !this.playground.game_map) {
            console.error('SafeZone: playground 或 game_map 不存在');
            return;
        }
        
        this.ctx = this.playground.game_map.ctx;
        
        // 毒圈视觉效果 - 改为半透明深蓝
        this.border_color = "rgba(0, 100, 200, 0.8)";        // 深蓝色边界
        this.inner_color = "rgba(0, 50, 150, 0.2)";         // 深蓝色内部填充
        this.warning_color = "rgba(0, 150, 255, 0.4)";       // 亮蓝色警告
    }
    
    start() {
        console.log('SafeZone start 被调用');
    }
    
    update() {
        // 确保每一帧都渲染
        this.render();
    }
    
    render() {
        // 安全检查
        if (!this.playground) {
            console.log('SafeZone: playground 不存在');
            return;
        }
        
        if (!this.ctx) {
            console.log('SafeZone: ctx 不存在，尝试重新获取');
            if (this.playground.game_map) {
                this.ctx = this.playground.game_map.ctx;
            } else {
                return;
            }
        }
        
        if (!this.playground.zone_center) {
            console.log('SafeZone: zone_center 不存在');
            return;
        }
        
        let ctx = this.ctx;
        let center = this.playground.zone_center;
        let current_radius = this.playground.get_current_zone_radius();
        let game_start_time = this.playground.game_start_time;
        let current_time = Date.now();
        let time_since_start = game_start_time ? current_time - game_start_time : 0;
        
        // 保存当前上下文状态
        ctx.save();
        
        ctx.beginPath();
        ctx.rect(0, 0, this.playground.width, this.playground.height);
        ctx.arc(center.x, center.y, current_radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 50, 150, 0.2)";
        ctx.fill("evenodd");
        
        // 绘制安全区边界
        ctx.beginPath();
        ctx.arc(center.x, center.y, current_radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.border_color;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 如果即将开始缩小，显示警告
        if (game_start_time && time_since_start > this.playground.zone_shrink_delay - 3000 && 
            time_since_start < this.playground.zone_shrink_delay) {
            
            // 显示倒计时文字
            let countdown = Math.ceil((this.playground.zone_shrink_delay - time_since_start) / 1000);
            ctx.font = "24px Arial";
            ctx.fillStyle = "yellow";
            ctx.textAlign = "center";
            ctx.fillText(`${countdown}s 后缩圈`, center.x, center.y - 50);
        }

        // 恢复上下文状态
        ctx.restore();
    }
}
class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        
        // 设置 canvas 大小
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        
        // 设置 canvas 样式
        this.$canvas.css({
            'position': 'absolute',
            'top': 0,
            'left': 0,
            'width': '100%',
            'height': '100%',
            'display': 'block'
        });
        
        this.playground.$playground.append(this.$canvas);
        
        console.log('GameMap 创建成功, canvas 大小:', 
                    this.ctx.canvas.width, this.ctx.canvas.height);
    }
    
    start() {
    }
    
    update() {
        this.render();
    }
    
    render() {
        // 原有的拖尾效果
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        
        this.ctx.restore();
        
        // 毒圈信息显示
        this.draw_zone_info();
    }
    
    draw_zone_info() {
        let ctx = this.ctx;
        let playground = this.playground;
        
        if (!playground || !playground.game_start_time) return;
        
        let current_time = Date.now();
        let time_since_start = current_time - playground.game_start_time;
        
        ctx.save();
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "right";
        ctx.fillStyle = "white";
        
        let info_x = this.ctx.canvas.width - 20;
        let info_y = 40;
        
        // 显示当前安全区状态
        if (time_since_start < playground.zone_shrink_delay) {
            let time_to_shrink = Math.ceil((playground.zone_shrink_delay - time_since_start) / 1000);
            ctx.fillStyle = "yellow";
            ctx.fillText(`缩圈倒计时: ${time_to_shrink}s`, info_x, info_y);
        } else if (time_since_start < playground.zone_shrink_delay + playground.zone_shrink_duration) {
            let progress = ((time_since_start - playground.zone_shrink_delay) / playground.zone_shrink_duration * 100).toFixed(0);
            ctx.fillStyle = "orange";
            ctx.fillText(`缩圈中: ${progress}%`, info_x, info_y);
        } else {
            ctx.fillStyle = "red";
            ctx.fillText(`最终安全区`, info_x, info_y);
        }
        
        ctx.restore();
    }
}
class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, is_me) {
        super();
        this.playground = playground;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.is_me = is_me;
        this.eps = 1;
        
        // 运动相关属性
        this.vx = 0;
        this.vy = 0;
        this.move_length = 0;
        
        // 技能相关
        this.our_skill = null;
        
        // 敌人射击相关
        this.shoot_cooldown = 360;           // 射击冷却时间
        this.shoot_cooldown_max = 360;       // 最大冷却时间（帧数），约1秒（60fps）
        
        // 击退相关属性
        this.damagex = 0;
        this.damagey = 0;
        this.damagespeed = 0;
        this.friction = 0.8;
        this.is_knocked_back = false;
        
        // 新增：技能冷却系统
        this.skill_cooldowns = {
            fireball: 0,
            iceball: 0,
            bomb: 0,
            arrow: 0,
            accelerate: 0
        };
        this.skill_cooldown_values = {
            fireball: 180,  // 火球术 3秒
            iceball: 240,   // 冰球术 2秒  
            bomb: 480,      // 炸弹 4秒
            arrow: 480,       // 箭矢 1.5秒
            accelerate: 180   // 加速 3秒
        };
        
        console.log('Player 创建:', {
            x, y, radius, color, speed, is_me
        });
        // 新增：毒圈相关属性
        this.last_zone_damage_time = 0;  // 上次受到毒圈伤害的时间
        this.zone_damage_interval = 1000;  // 毒圈伤害间隔（毫秒）
    }
    start() {
        if(this.is_me) {
            this.add_listening_events();
        }
    }
    
    add_listening_events() {
        let outer = this;
        
        // 禁用右键菜单
        this.playground.game_map.$canvas.on("contextmenu", function() {
            return false;
        });
        
        // 鼠标右键点击事件
        this.playground.game_map.$canvas.mousedown(function(e) {
            if(e.which === 3) {  // 右键
                let canvas = outer.playground.game_map.$canvas[0];
                let rect = canvas.getBoundingClientRect();
                let scaleX = canvas.width / rect.width;
                let scaleY = canvas.height / rect.height;
                
                let tx = (e.clientX - rect.left) * scaleX;
                let ty = (e.clientY - rect.top) * scaleY;
                
                outer.move_to(tx, ty);
            } else if(e.which === 1) {  // 左键
                if(outer.our_skill == "fireball" && outer.skill_cooldowns.fireball <= 0) {
                    outer.shoot_fireball(e.clientX, e.clientY);
                    outer.skill_cooldowns.fireball = outer.skill_cooldown_values.fireball;
                } else if(outer.our_skill == "commonattack") {
                    outer.shoot_commonattack(e.clientX, e.clientY);
                } else if(outer.our_skill == "iceball" && outer.skill_cooldowns.iceball <= 0) {
                    outer.shoot_iceball(e.clientX, e.clientY);
                    outer.skill_cooldowns.iceball = outer.skill_cooldown_values.iceball;
                } else if(outer.our_skill == "bomb" && outer.skill_cooldowns.bomb <= 0) {
                    outer.shoot_bomb(e.clientX, e.clientY);
                    outer.skill_cooldowns.bomb = outer.skill_cooldown_values.bomb;
                } else if(outer.our_skill == "arrow" && outer.skill_cooldowns.arrow <= 0) {
                    outer.shoot_arrow(e.clientX, e.clientY);
                    outer.skill_cooldowns.arrow = outer.skill_cooldown_values.arrow;
                } else if(outer.our_skill == "accelerate" && outer.skill_cooldowns.accelerate <= 0) {
                    outer.accelerate(true);
                    outer.skill_cooldowns.accelerate = outer.skill_cooldown_values.accelerate;
                }
                outer.our_skill = "commonattack";  // 每次左键攻击后重置为普通攻击
            }
        });
    
        $(window).keydown(function(e) {
            if(e.which === 81) {  // q键
                outer.our_skill = "fireball";
                return false;
            } else if(e.which === 87) {  // w键
                outer.our_skill = "iceball";
                return false;
            } else if(e.which === 69) {  // e键
                outer.our_skill = "bomb";
                return false;
            } else if(e.which === 83) {  // s键
                outer.our_skill = "arrow";
                return false;
            } else if(e.which === 32) {  // 空格键 (key code 32)
                outer.accelerate(true);  // 按下空格，开始加速
                return false;  // 防止页面滚动
            }
        });
        
        // 键盘松开事件
        $(window).keyup(function(e) {
            if(e.which === 32) {  // 空格键松开
                outer.accelerate(false);  // 松开空格，停止加速
                return false;
            }
        });
    }  
    shoot_fireball(tx, ty) {
        let x = this.x;
        let y = this.y;
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        let color = "orange";
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1.5;
        let damage = this.playground.height * 0.01;
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, damage);
    }
    shoot_commonattack(tx, ty) {
        let x = this.x;
        let y = this.y;
        let radius = this.playground.height * 0.005;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        let color = "white";
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1.5;
        let damage = this.playground.height * 0.004;
        
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, damage);
    }
    shoot_iceball(tx, ty) {
        let x = this.x;
        let y = this.y;
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        let color = "lightblue";//淡蓝？
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1.5;
        let damage = this.playground.height * 0.004;
        
        new FireBall(this.playground, this, x, y, radius, vx, vy, color, speed, move_length, damage);
    }
    shoot_bomb(tx, ty) {
        // 注意：炸弹不需要目标位置，就在玩家当前位置爆炸
        let x = this.x;
        let y = this.y;
        let color = "white";  // 炸弹颜色
        let damage = this.playground.height * 0.01;  // 总伤害
        
        new Bomb(this.playground, this, x, y, color, damage);
        
        console.log('炸弹爆炸！');
    }
    shoot_arrow(tx, ty) {
        // 箭头技能：沿方向连续发射多个小球
        let x = this.x;
        let y = this.y;
        let color = "white";
        let damage = this.playground.height * 0.012;  // 总伤害
        
        new Arrow(this.playground, this, x, y, tx, ty, color, damage);
        
        //console.log('发射箭矢技能！');
    }
    accelerate(is_pressed) {
        if (is_pressed) {
            if (!this.is_accelerating) {
                this.normal_speed = this.speed;  // 保存当前速度
                this.speed *= 2.0;  // 速度提升到2倍
                this.is_accelerating = true;
            }
        } else {
            if (this.is_accelerating) {
                this.speed = this.normal_speed;  // 恢复原速
                this.is_accelerating = false;
            }
        }
    }
    enemy_shoot_fireball() {
        // 获取所有活着的玩家（不包括自己）
        let targets = this.playground.players.filter(p => p !== this);
        
        // 如果没有目标，就不射击
        if (targets.length === 0) {
            return;
        }
        
        // 随机选择一个目标
        let target = targets[Math.floor(Math.random() * targets.length)];
        
        // 计算射击角度
        let angle = Math.atan2(target.y - this.y, target.x - this.x);
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        
        let radius = this.playground.height * 0.01;
        let color = "orange";
        let speed = this.playground.height * 0.4;
        let move_length = this.playground.height * 1.5;
        // 敌人火球伤害调整，与玩家火球一致
        let damage = this.playground.height * 0.02;
        
        new FireBall(this.playground, this, this.x, this.y, radius, vx, vy, color, speed, move_length, damage);
        
        console.log('敌人发射火球!', '目标:', target.color, '射击者:', this.color);
    }   
    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    move_to(tx, ty) {
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }
    is_attacked(angle, damage, our_skill) {
        // 被击中时生成小碎片
        this.generate_particles(12);
        
        this.radius -= damage;
        
        if(this.radius < 10) {
            this.generate_particles(20);
            this.destroy();
            return false;
        }
        if(our_skill === "commonattack" || our_skill === "fireball" || our_skill === "bomb") {
            this.damagex = Math.cos(angle);
            this.damagey = Math.sin(angle);
            this.damagespeed = damage * 20;
            this.move_length = 0;
            this.vx = 0;
            this.vy = 0;
            this.is_knocked_back = true;
        } else if(our_skill === "iceball") {
            this.vx *= 0.5;
            this.vy *= 0.5;
        }

    }
    generate_particles(count) {
        for(let i = 0; i < count; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 3 + 1;
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let particle_radius = Math.random() * 2 + 1;
            let lifetime = Math.floor(Math.random() * 15 + 10);
            
            new Particle(
                this.playground,
                this.x + (Math.random() - 0.5) * this.radius,
                this.y + (Math.random() - 0.5) * this.radius,
                particle_radius,
                this.color,
                vx,
                vy,
                lifetime
            );
        }
    }
    
    destroy() {
        // 从 playground 的 players 数组中移除自己
        if (this.playground && this.playground.players) {
            let index = this.playground.players.indexOf(this);
            if (index !== -1) {
                this.playground.players.splice(index, 1);
                console.log(`从 players 数组中移除玩家，剩余数量: ${this.playground.players.length}`);
            }
        }
        super.destroy();
    }
    
    on_destroy() {
        this.generate_particles(25);
        
        setTimeout(() => {
            if (this.playground) {
                let remaining_enemies = this.playground.players.filter(p => !p.is_me).length;
                let me_alive = this.playground.players.some(p => p.is_me);
                
                console.log("游戏状态检查:", {
                    me_alive,
                    remaining_enemies,
                    total: this.playground.players.length
                });
                if (!me_alive || remaining_enemies === 0) {
                    console.log("游戏结束条件触发", {me_alive, remaining_enemies});
                    this.playground.root.game_over();
                }
            }
        }, 500);
    }
    
    update() {
        // 确保 timedelta 有效
        if (!this.timedelta || this.timedelta > 100) {
            this.timedelta = 16;
        }
        // 新增：毒圈伤害检查
        if (this.playground && this.playground.game_start_time) {
            this.check_zone_damage();
        }

        // 新增：更新技能冷却
        // 更新技能冷却
        if (this.is_me) {
            for (let skill in this.skill_cooldowns) {
                if (this.skill_cooldowns[skill] > 0) {
                    this.skill_cooldowns[skill] -= 1;
                }
            }
        }
        // 处理击退效果
        if (this.damagespeed > 0.1) {
            let moved = this.damagespeed * this.timedelta / 1000;
            this.x += this.damagex * moved;
            this.y += this.damagey * moved;
            
            // 边界检查
            this.x = Math.max(this.radius, Math.min(this.playground.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(this.playground.height - this.radius, this.y));
            
            this.damagespeed *= this.friction;
        } else {
            // 击退结束
            if (this.is_knocked_back) {
                this.is_knocked_back = false;
                this.damagespeed = 0;
            }
            
            // --- 敌人的随机移动逻辑（完全不变）---
            if (!this.is_me) {
                // 更新射击冷却
                this.shoot_cooldown -= 1;
                
                // 冷却结束，随机发射火球
                if (this.shoot_cooldown <= 0) {
                    // 50% 概率发射火球
                    if (Math.random() < 0.5) {
                        this.enemy_shoot_fireball();
                    }
                    // 重置冷却时间（随机，让发射更自然）
                    this.shoot_cooldown = Math.floor(Math.random() * 180 + 360);  // 60-150帧
                }
            }
            
            // --- 原有的移动逻辑（完全不变）---
            if (this.move_length > this.eps) {
                let moved = Math.min(this.speed * this.timedelta / 1000, this.move_length);
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                this.move_length -= moved;
            } else {
                this.move_length = 0;
                this.vx = 0;
                this.vy = 0;
                
                // 敌人的随机移动逻辑（完全不变）
                if(!this.is_me) {
                    let tx = Math.random() * this.playground.width;
                    let ty = Math.random() * this.playground.height;
                    this.move_to(tx, ty);
                }
            }
        }
        // 边界检查
        this.x = Math.max(this.radius, Math.min(this.playground.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(this.playground.height - this.radius, this.y));
        
        this.render();
    }
    check_zone_damage() {
        let current_time = Date.now();
        
        // 检查是否在安全区内
        let in_safe_zone = this.playground.is_point_in_safe_zone(this.x, this.y);
        
        // 如果不在安全区内
        if (!in_safe_zone) {
            // 检查伤害间隔
            if (current_time - this.last_zone_damage_time >= this.zone_damage_interval) {
                // 计算毒圈伤害（基于时间）
                let game_time = current_time - this.playground.game_start_time;
                let damage_multiplier = 1.0;
                
                // 游戏时间越长，伤害越高
                if (game_time > this.playground.zone_shrink_delay + this.playground.zone_shrink_duration) {
                    // 缩圈完成后伤害加倍
                    damage_multiplier = 2.0;
                }
                
                let zone_damage = this.playground.zone_damage * damage_multiplier;
                
                // 受到伤害
                this.radius -= zone_damage;
                
                // 生成被毒圈伤害的粒子效果
                this.generate_zone_damage_particles();
                
                // 更新上次伤害时间
                this.last_zone_damage_time = current_time;
                
                console.log(`玩家在毒圈中受到伤害，当前半径: ${this.radius}`);
                
                // 如果半径太小，销毁
                if (this.radius < 5) {
                    this.generate_particles(20);
                    this.destroy();
                    return false;
                }
            }
        }
    }
    
    // 新增：毒圈伤害粒子效果
    generate_zone_damage_particles() {
        for(let i = 0; i < 5; i++) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 2 + 1;
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            let particle_radius = Math.random() * 2 + 1;
            let lifetime = Math.floor(Math.random() * 10 + 5);
            
            new Particle(
                this.playground,
                this.x + (Math.random() - 0.5) * this.radius,
                this.y + (Math.random() - 0.5) * this.radius,
                particle_radius,
                "rgba(255, 0, 0, 0.8)",  // 红色粒子表示毒圈伤害
                vx,
                vy,
                lifetime
            );
        }
    }
    render() {
        let ctx = this.playground.game_map.ctx;
        
        // 绘制玩家
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        if (this.is_me) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 1, 0, Math.PI * 2);
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // 新增：在左下角绘制技能冷却界面
            this.draw_skill_cooldown();
        }
    }

    // 新增：绘制技能冷却的方法
    draw_skill_cooldown() {
        let ctx = this.playground.game_map.ctx;
        let canvas_width = this.playground.width;
        let canvas_height = this.playground.height;
        
        // 设置左下角位置
        let start_x = 20;
        let start_y = canvas_height - 150;
        let box_size = 50;
        let spacing = 10;
        
        // 技能配置
        const skills = [
            { name: 'fireball', key: 'Q', color: 'orange', label: '火球' },
            { name: 'iceball', key: 'W', color: 'lightblue', label: '冰球' },
            { name: 'bomb', key: 'E', color: 'white', label: '炸弹' },
            { name: 'arrow', key: 'S', color: 'gray', label: '箭矢' },
            { name: 'accelerate', key: '空格', color: 'yellow', label: '加速' }  // 可选
        ];
        
        // 绘制半透明背景
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(start_x - 5, start_y - 5, 
                    (box_size + spacing) * skills.length + 5, 
                    box_size + 40);
        
        // 绘制每个技能的冷却框
        for (let i = 0; i < skills.length; i++) {
            let skill = skills[i];
            let x = start_x + i * (box_size + spacing);
            let y = start_y;
            let cd = this.skill_cooldowns[skill.name];
            let max_cd = this.skill_cooldown_values ? this.skill_cooldown_values[skill.name] : this.skill_cooldown_max;
            let progress = cd / max_cd;
            
            // 绘制技能背景框
            ctx.fillStyle = "rgba(50, 50, 50, 0.8)";
            ctx.fillRect(x, y, box_size, box_size);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, box_size, box_size);
            
            // 如果有冷却，绘制冷却遮罩
            if (cd > 0) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(x, y + box_size * (1 - progress), box_size, box_size * progress);
                
                // 显示冷却数字
                ctx.fillStyle = "white";
                ctx.font = "bold 16px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(Math.ceil(cd / 60) + "s", x + box_size/2, y + box_size/2);
            }
            
            // 绘制技能图标（用颜色方块代替）
            ctx.fillStyle = skill.color;
            ctx.fillRect(x + 5, y + 5, box_size - 10, box_size - 10);
            
            // 绘制技能按键提示
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(skill.key, x + box_size/2, y - 5);
            
            // 绘制技能名称
            ctx.font = "12px Arial";
            ctx.fillText(skill.label, x + box_size/2, y + box_size + 15);
        }
        
        // 绘制普通攻击提示
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("左键: 普通攻击", start_x, start_y - 30);
        ctx.fillText("右键: 移动", start_x, start_y - 50);
    }
}
class FireBall extends AcGameObject {
    constructor(playground,player,x,y,radius,vx,vy,color,speed,move_length,damage) {
        super();
        this.playground = playground;
        this.player = player;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.eps = 0.1;
        this.ctx = this.playground.game_map.ctx;
        this.damage = damage;
    }
    start() {

    }
    update() {
        if(this.move_length < this.eps) {
            this.destroy();
            return false;
        }
        let moved = Math.min(this.move_length,this.speed * this.timedelta / 1000);
        this.x += this.vx * moved;
        this.y += this.vy * moved;
        
        this.move_length -= moved;

        for(let i = 0;i < this.playground.players.length;i++) {
            let player = this.playground.players[i];
            if(this.player !== player && this.is_collision(player)) {
                this.attack(player);
            }
        }
        
        this.render();
    }
    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
    is_collision(player) {
        let dist = this.get_dist(this.x,this.y,player.x,player.y);
        if(dist < this.radius + player.radius)
                return true;
        return false;
    }

    attack(player) {
        let angle = Math.atan2(player.y - this.y,player.x - this.x);
        player.is_attacked(angle,this.damage, this.color === "lightblue" ? "iceball" : (this.color === "white" ? "commonattack" : "fireball"));
        this.destroy();
    }
    
    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x,this.y,this.radius,0,Math.PI * 2,false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class Bomb extends AcGameObject {
    constructor(playground, player, x, y, color, damage) {
        super();
        this.playground = playground;
        this.player = player;
        this.x = x;
        this.y = y;
        this.color = color;
        this.damage = damage;
        
        // 爆炸参数
        this.particle_count = 10;  // 发射的小球数量
        this.particle_speed = playground.height * 0.03;  // 降低速度
        this.particle_radius = playground.height * 0.005;  // 小球半径
        this.particle_move_length = playground.height * 0.8;  // 移动距离
        
        // 爆炸视觉效果
        this.explosion_radius = playground.height * 0.08;
        this.lifetime = 10;
        this.age = 0;
        
        //console.log('炸弹创建，将在原地爆炸');
    }
    
    start() {
        // 立即产生爆炸效果
        this.explode();
    }
    
    explode() {
        // 向四面八方发射小球
        for(let i = 0; i < this.particle_count; i++) {
            // 计算角度（均匀分布）
            let angle = (i / this.particle_count) * Math.PI * 2;
            
            // 添加一些随机扰动，让爆炸更自然
            angle += (Math.random() - 0.5) * 0.2;
            
            // 计算速度（使用 FireBall 的标准速度计算方式）
            let speed = this.particle_speed * (0.8 + Math.random() * 0.4);
            let vx = Math.cos(angle) * speed;
            let vy = Math.sin(angle) * speed;
            
            // 随机半径
            let radius = this.particle_radius * (0.8 + Math.random() * 0.7);
            
            // 随机移动距离
            let move_length = this.particle_move_length * (0.7 + Math.random() * 0.6);
            
            // 直接使用 FireBall 类，就像 commonattack 一样
            new FireBall(
                this.playground,
                this.player,
                this.x,
                this.y,
                radius,
                vx,
                vy,
                "white",  // 白色，和普通攻击一样
                speed,
                move_length,
                this.damage * 0.3  // 每个小球的伤害降低，因为数量多
            );
        }
    }
    
    update() {
        this.age++;
        
        // 炸弹本体短暂存在后消失
        if (this.age >= this.lifetime) {
            this.destroy();
            return false;
        }
        
        this.render();
    }
    
    render() {
        let ctx = this.playground.game_map.ctx;
        
        // 绘制爆炸效果（纯视觉效果，不影响游戏逻辑）
        let alpha = 1 - (this.age / this.lifetime);
        let radius = this.explosion_radius * alpha;
        
        // 外圈
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.3})`;
        ctx.fill();
        
        // 内圈
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
    }
}
class Arrow extends AcGameObject {
    constructor(playground, player, x, y, target_x, target_y, color, damage) {
        super();
        this.playground = playground;
        this.player = player;
        this.x = x;
        this.y = y;
        this.color = color;
        this.damage = damage;
        
        // 计算方向角度
        this.angle = Math.atan2(target_y - y, target_x - x);
        
        // 箭矢参数
        this.arrow_count = 8;  // 连续射出的小球数量
        this.shoot_interval = 2;  // 发射间隔（帧数）
        this.current_arrow = 0;  // 当前已发射数量
        this.age = 0;  // 计时器
        
        // 小球参数
        this.ball_radius = playground.height * 0.005;  // 小球半径
        this.ball_speed = playground.height * 0.03;  // 小球速度
        this.ball_move_length = playground.height * 1.2;  // 移动距离
        
        
    }
    
    start() {
    }
    
    update() {
        this.age++;
        
        // 按间隔发射小球
        if (this.age % this.shoot_interval === 0 && this.current_arrow < this.arrow_count) {
            this.shoot_arrow();
        }
        
        // 所有箭矢发射完毕后销毁
        if (this.current_arrow >= this.arrow_count) {
            this.destroy();
            return false;
        }
    }
    
    shoot_arrow() {
        // 计算当前箭矢的轻微偏移（让散射更自然）
        let offset_angle = 0;
        
        // 可以根据需要添加角度偏移，实现散射效果
        // 这里使用线性偏移，让箭矢稍微散开
        let spread = 0.1;  // 散射幅度
        let middle = this.arrow_count / 2;
        offset_angle = (this.current_arrow - middle) * spread;
        
        let final_angle = this.angle + offset_angle;
        
        // 计算速度
        let vx = Math.cos(final_angle) * this.ball_speed;
        let vy = Math.sin(final_angle) * this.ball_speed;
        
        // 随机微小扰动
        vx *= (0.95 + Math.random() * 0.1);
        vy *= (0.95 + Math.random() * 0.1);
        
        // 随机半径
        let radius = this.ball_radius * (0.8 + Math.random() * 0.4);
        
        // 随机移动距离
        let move_length = this.ball_move_length * (0.8 + Math.random() * 0.4);
        
        // 创建白色小球（使用 FireBall 类）
        new FireBall(
            this.playground,
            this.player,
            this.x,
            this.y,
            radius,
            vx,
            vy,
            "white",  // 白色小球
            this.ball_speed,
            move_length,
            this.damage * 0.3  // 每个小球伤害较低，因为数量多
        );
        
        this.current_arrow++;
        console.log(`发射箭矢 ${this.current_arrow}/${this.arrow_count}`);
    }
    
    render() {
        // 可选：在发射点绘制一个短暂的特效
        let ctx = this.playground.game_map.ctx;
        
        // 只在发射期间绘制
        if (this.current_arrow < this.arrow_count) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.playground.height * 0.02, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3})`;
            ctx.fill();
        }
    }
}
class Particle extends AcGameObject {
    constructor(playground, x, y, radius, color, vx, vy, lifetime) {
        super();
        this.playground = playground;
        this.x = x;
        this.y = y;
        this.radius = radius;        // 很小的半径
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.lifetime = lifetime;    // 生命周期（帧数）
    }
    
    start() {
    }
    
    update() {
        // 减少生命周期
        this.lifetime -= 1;
        if (this.lifetime <= 0) {
            this.destroy();
            return false;
        }
        
        // 匀速直线运动
        this.x += this.vx;
        this.y += this.vy;
        
        this.render();
    }
    
    render() {
        let ctx = this.playground.game_map.ctx;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
class AcGame {
    constructor(id) {
        this.id = id;
        this.$ac_game = $('#' + id);
        
        // 设置容器样式
        this.$ac_game.css({
            'width': '100%',
            'height': '100vh',
            'position': 'relative',
            'overflow': 'hidden',
            'background': '#1a1a2e'
        });
        
        // 默认设置
        this.settings = {
            difficulty: 'medium',
            shoot_cooldown_range: { min: 240, max: 480 }
        };
        
        this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);
        this.intro = new AcGameIntro(this);
        this.settings = new AcGameSettings(this);  // 创建设置界面
        
        // 创建游戏结束界面（初始隐藏）
        this.$game_over = $(`
            <div class="ac-game-over" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                display: none;
            ">
                <div style="
                    text-align: center;
                    color: white;
                    font-size: 40px;
                ">
                    <div>游戏结束</div>
                    <div style="margin-top: 30px;">
                        <button class="restart-btn" style="
                            font-size: 24px;
                            padding: 10px 30px;
                            cursor: pointer;
                        ">重新开始</button>
                        <button class="menu-btn" style="
                            font-size: 24px;
                            padding: 10px 30px;
                            margin-left: 20px;
                            cursor: pointer;
                        ">返回菜单</button>
                    </div>
                </div>
            </div>
        `);
        
        this.$ac_game.append(this.$game_over);
        
        // 绑定按钮事件
        this.$game_over.find('.restart-btn').click(() => {
            this.restart_game();
        });
        
        this.$game_over.find('.menu-btn').click(() => {
            this.back_to_menu();
        });
        
        this.playground.hide();
        
        this.start();
    }
    
    start() {
    }
    
    // 显示游戏结束界面
    game_over() {
        console.log("游戏结束");
        
        // 隐藏游戏界面
        this.playground.hide();
        
        // 显示游戏结束界面
        this.$game_over.show();
    }
    
    // 重新开始游戏
    restart_game() {
        this.$game_over.hide();
        
        // 销毁当前游戏界面
        if (this.playground) {
            // 清理所有游戏对象
            AC_GAME_OBJECT = [];
            
            // 移除旧界面
            this.playground.$playground.remove();
        }
        
        // 创建新游戏界面
        this.playground = new AcGamePlayground(this);
        this.playground.show();
    }
    
    // 返回主菜单
    back_to_menu() {
        this.$game_over.hide();
        
        // 清理游戏界面
        if (this.playground) {
            AC_GAME_OBJECT = [];
            this.playground.$playground.remove();
        }
        
        // 显示菜单
        this.menu.show();
    }
}