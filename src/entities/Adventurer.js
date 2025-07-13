/**
 * 冒險者類
 */
export default class Adventurer {
  /**
   * 創建冒險者
   * @param {Object} config - 冒險者配置
   */
  constructor(config = {}) {
    this.id = config.id || this.generateId();
    this.name = config.name || this.generateName();
    this.profession = config.profession || 'warrior'; // warrior, mage, archer, rogue, cleric
    this.hp = config.hp || this.generateHP();
    this.maxHP = this.hp;
    this.attack = config.attack || this.generateAttack();
    this.defense = config.defense || this.generateDefense();
    this.equipment = config.equipment || this.generateBasicEquipment();
    this.level = config.level || 1;
    this.experience = config.experience || 0;
    this.skills = config.skills || this.generateSkills();
  }

  /**
   * 生成隨機ID
   */
  generateId() {
    return 'adv_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成隨機名稱
   */
  generateName() {
    const firstNames = ['艾莉亞', '凱文', '莉娜', '達倫', '索菲亞', '馬克斯', '露娜', '雷克斯', '薇拉', '奧斯卡'];
    const lastNames = ['劍心', '法師', '神射手', '暗影', '聖光', '鐵盾', '風行者', '火焰', '冰霜', '雷鳴'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName}·${lastName}`;
  }

  /**
   * 根據職業生成HP
   */
  generateHP() {
    const baseHP = {
      warrior: 120,
      mage: 80,
      archer: 90,
      rogue: 85,
      cleric: 100
    };
    
    const base = baseHP[this.profession] || 100;
    return base + Math.floor(Math.random() * 20) - 10; // ±10變化
  }

  /**
   * 根據職業生成攻擊力
   */
  generateAttack() {
    const baseAttack = {
      warrior: 25,
      mage: 30,
      archer: 28,
      rogue: 26,
      cleric: 18
    };
    
    const base = baseAttack[this.profession] || 25;
    return base + Math.floor(Math.random() * 10) - 5; // ±5變化
  }

  /**
   * 根據職業生成防禦力
   */
  generateDefense() {
    const baseDefense = {
      warrior: 20,
      mage: 8,
      archer: 12,
      rogue: 10,
      cleric: 15
    };
    
    const base = baseDefense[this.profession] || 15;
    return base + Math.floor(Math.random() * 6) - 3; // ±3變化
  }

  /**
   * 生成基礎裝備
   */
  generateBasicEquipment() {
    const basicEquipment = {
      warrior: {
        weapon: '鐵劍',
        armor: '皮甲',
        accessory: '力量護符'
      },
      mage: {
        weapon: '法杖',
        armor: '法袍',
        accessory: '智慧寶石'
      },
      archer: {
        weapon: '短弓',
        armor: '皮甲',
        accessory: '敏捷靴'
      },
      rogue: {
        weapon: '匕首',
        armor: '皮甲',
        accessory: '隱身斗篷'
      },
      cleric: {
        weapon: '聖杖',
        armor: '聖袍',
        accessory: '聖光護符'
      }
    };
    
    return basicEquipment[this.profession] || basicEquipment.warrior;
  }

  /**
   * 生成技能
   */
  generateSkills() {
    const professionSkills = {
      warrior: ['劍術精通', '盾牌格擋', '戰吼'],
      mage: ['火球術', '冰霜護盾', '魔法飛彈'],
      archer: ['精準射擊', '多重射擊', '鷹眼'],
      rogue: ['潛行', '背刺', '毒刃'],
      cleric: ['治療術', '聖光術', '祝福']
    };
    
    return professionSkills[this.profession] || [];
  }

  /**
   * 計算總戰鬥力
   */
  getCombatPower() {
    const equipmentBonus = this.getEquipmentBonus();
    return Math.floor((this.hp * 0.5 + this.attack * 2 + this.defense * 1.5) * (1 + equipmentBonus / 100));
  }

  /**
   * 獲取裝備加成
   */
  getEquipmentBonus() {
    // 簡單的裝備加成計算，可以後續擴展
    return this.level * 5; // 每級5%加成
  }

  /**
   * 獲取職業顯示名稱
   */
  getProfessionDisplayName() {
    const displayNames = {
      warrior: '戰士',
      mage: '法師',
      archer: '弓箭手',
      rogue: '盜賊',
      cleric: '牧師'
    };
    
    return displayNames[this.profession] || '未知';
  }

  /**
   * 治療
   */
  heal(amount) {
    this.hp = Math.min(this.maxHP, this.hp + amount);
  }

  /**
   * 受傷
   */
  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  /**
   * 是否存活
   */
  isAlive() {
    return this.hp > 0;
  }

  /**
   * 獲取狀態信息
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      profession: this.profession,
      professionDisplay: this.getProfessionDisplayName(),
      level: this.level,
      hp: this.hp,
      maxHP: this.maxHP,
      attack: this.attack,
      defense: this.defense,
      combatPower: this.getCombatPower(),
      equipment: this.equipment,
      skills: this.skills,
      isAlive: this.isAlive()
    };
  }

  /**
   * 序列化為JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      profession: this.profession,
      hp: this.hp,
      maxHP: this.maxHP,
      attack: this.attack,
      defense: this.defense,
      equipment: this.equipment,
      level: this.level,
      experience: this.experience,
      skills: this.skills
    };
  }

  /**
   * 從JSON數據創建冒險者
   */
  static fromJSON(data) {
    return new Adventurer(data);
  }
}
