class SkillsManager {
    constructor() {
        this.skills = {};
        this.currentEditingSkill = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSkills();
    }

    setupEventListeners() {
        // 添加技能按钮
        document.getElementById('add-skill-btn').addEventListener('click', () => {
            this.showSkillModal();
        });

        // 技能表单提交
        document.getElementById('skill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSkill();
        });

        // 技能等级滑块
        document.getElementById('skill-level').addEventListener('input', (e) => {
            document.getElementById('skill-level-value').textContent = e.target.value;
        });

        // 模态框关闭
        document.getElementById('cancel-skill').addEventListener('click', () => {
            this.hideSkillModal();
        });

        document.querySelector('#skill-modal .modal-close').addEventListener('click', () => {
            this.hideSkillModal();
        });

        // 点击模态框外部关闭
        document.getElementById('skill-modal').addEventListener('click', (e) => {
            if (e.target.id === 'skill-modal') {
                this.hideSkillModal();
            }
        });
    }

    async loadSkills() {
        try {
            const response = await fetch('/api/skills?format=grouped');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.skills = data.data.skills;
                    this.renderSkills();
                } else {
                    this.showError('加载技能失败: ' + data.message);
                }
            } else {
                this.showError('加载技能失败');
            }
        } catch (error) {
            console.error('Load skills error:', error);
            this.showError('加载技能失败');
        }
    }

    renderSkills() {
        const container = document.querySelector('.skills-categories');
        container.innerHTML = '';

        Object.entries(this.skills).forEach(([categoryKey, category]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'skill-category-admin';

            categoryDiv.innerHTML = `
                <div class="category-header">
                    <h3>${category.title}</h3>
                    <span class="skill-count">${category.skills.length} 个技能</span>
                </div>
                <div class="skills-grid-admin">
                    ${category.skills.map((skill, index) => this.createSkillCard(skill, categoryKey, index)).join('')}
                </div>
            `;

            container.appendChild(categoryDiv);
        });

        // 添加事件监听器
        this.attachSkillCardListeners();
    }

    createSkillCard(skill, category, index) {
        return `
            <div class="skill-card-admin" data-category="${category}" data-index="${index}">
                <div class="skill-header">
                    <div class="skill-icon">
                        <i class="${skill.icon}" style="color: ${skill.color}"></i>
                    </div>
                    <div class="skill-info">
                        <h4>${skill.name}</h4>
                        <div class="skill-level-display">
                            <div class="level-bar">
                                <div class="level-progress" style="width: ${skill.level}%; background-color: ${skill.color}"></div>
                            </div>
                            <span class="level-text">${skill.level}%</span>
                        </div>
                    </div>
                </div>
                <div class="skill-actions">
                    <button class="btn-icon edit-skill" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-skill" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachSkillCardListeners() {
        // 编辑技能
        document.querySelectorAll('.edit-skill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.skill-card-admin');
                const category = card.dataset.category;
                const index = parseInt(card.dataset.index);
                const skill = this.skills[category].skills[index];
                this.editSkill(skill, category, index);
            });
        });

        // 删除技能
        document.querySelectorAll('.delete-skill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.skill-card-admin');
                const category = card.dataset.category;
                const index = parseInt(card.dataset.index);
                const skill = this.skills[category].skills[index];
                this.deleteSkill(skill, category, index);
            });
        });
    }

    showSkillModal(skill = null) {
        const modal = document.getElementById('skill-modal');
        const title = document.getElementById('skill-modal-title');
        const form = document.getElementById('skill-form');

        if (skill) {
            title.textContent = '编辑技能';
            this.fillSkillForm(skill);
        } else {
            title.textContent = '添加技能';
            form.reset();
            document.getElementById('skill-level-value').textContent = '50';
        }

        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    hideSkillModal() {
        const modal = document.getElementById('skill-modal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            this.currentEditingSkill = null;
        }, 300);
    }

    fillSkillForm(skill) {
        document.getElementById('skill-name').value = skill.name;
        document.getElementById('skill-category').value = skill.category || 'other';
        document.getElementById('skill-level').value = skill.level;
        document.getElementById('skill-level-value').textContent = skill.level;
        document.getElementById('skill-icon').value = skill.icon || '';
        document.getElementById('skill-color').value = skill.color || '#00d4ff';
        document.getElementById('skill-description').value = skill.description || '';
    }

    async saveSkill() {
        const form = document.getElementById('skill-form');
        const formData = new FormData(form);
        const skillData = {
            name: formData.get('name'),
            category: formData.get('category'),
            level: parseInt(formData.get('level')),
            icon: formData.get('icon') || 'fas fa-code',
            color: formData.get('color'),
            description: formData.get('description')
        };

        try {
            let response;
            if (this.currentEditingSkill) {
                // 更新现有技能
                response = await fetch(`/api/skills/${this.currentEditingSkill.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(skillData)
                });
            } else {
                // 创建新技能
                response = await fetch('/api/skills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(skillData)
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showSuccess(this.currentEditingSkill ? '技能更新成功' : '技能创建成功');
                    this.hideSkillModal();
                    this.loadSkills(); // 重新加载技能列表
                } else {
                    this.showError(result.message);
                }
            } else {
                this.showError('保存技能失败');
            }
        } catch (error) {
            console.error('Save skill error:', error);
            this.showError('保存技能失败');
        }
    }

    editSkill(skill, category, index) {
        // 需要获取完整的技能信息，包括ID
        this.currentEditingSkill = { ...skill, category, index };
        this.showSkillModal(skill);
    }

    async deleteSkill(skill, category, index) {
        if (!confirm(`确定要删除技能 "${skill.name}" 吗？`)) {
            return;
        }

        try {
            // 注意：这里需要技能的ID，但当前数据结构中可能没有
            // 临时解决方案：通过名称和分类来删除
            const response = await fetch('/api/skills/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    category: category,
                    skillName: skill.name
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.showSuccess('技能删除成功');
                    this.loadSkills(); // 重新加载技能列表
                } else {
                    this.showError(result.message);
                }
            } else {
                this.showError('删除技能失败');
            }
        } catch (error) {
            console.error('Delete skill error:', error);
            this.showError('删除技能失败');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.background = '#4caf50';
        } else if (type === 'error') {
            notification.style.background = '#f44336';
        } else {
            notification.style.background = '#2196f3';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 获取技能统计信息
    getSkillsStats() {
        let totalSkills = 0;
        let totalLevel = 0;

        Object.values(this.skills).forEach(category => {
            totalSkills += category.skills.length;
            category.skills.forEach(skill => {
                totalLevel += skill.level;
            });
        });

        return {
            total: totalSkills,
            averageLevel: totalSkills > 0 ? Math.round(totalLevel / totalSkills) : 0
        };
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);