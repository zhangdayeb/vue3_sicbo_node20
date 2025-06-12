<template>
  <div class="roadmap-row">
    <!-- 行标签 -->
    <div class="row-label">
      <span class="label-text">{{ label }}</span>
    </div>
    
    <!-- 结果列 -->
    <div class="result-columns" ref="columnsContainer">
      <div 
        v-for="(result, index) in visibleResults" 
        :key="index"
        class="result-cell"
        :class="getCellClass(result, index)"
      >
        <!-- 骰子图片 -->
        <img 
          v-if="type === 'dice'" 
          :src="getDiceImage(result)"
          :alt="`骰子${result}`"
          class="dice-image"
        />
        
        <!-- 文字结果 -->
        <span v-else class="result-text">
          {{ getResultText(result) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  label: string                    // 行标签
  type: 'dice' | 'size' | 'parity' | 'sum'  // 行类型
  data: (number | string)[]        // 结果数据
  maxColumns?: number              // 最大显示列数
}

const props = withDefaults(defineProps<Props>(), {
  maxColumns: 20
})

const columnsContainer = ref<HTMLElement>()

// 根据容器宽度计算能显示的列数
// 在 RoadmapRow.vue 中修改
const calculateVisibleColumns = () => {
  if (!columnsContainer.value) return Math.min(props.data.length, 20)
  
  const containerWidth = columnsContainer.value.clientWidth
  const columnWidth = 40  // 🔥 统一使用40px，不再区分骰子和其他类型
  const gap = 2
  
  const maxColumns = Math.floor((containerWidth + gap) / (columnWidth + gap))
  const actualColumns = Math.min(Math.max(6, maxColumns), props.data.length)
  
  return actualColumns
}

// 响应式计算可见结果
const visibleResults = computed(() => {
  const maxCols = calculateVisibleColumns()
  return props.data.slice(-maxCols) // 取最后N条记录
})

// 获取骰子图片路径
const getDiceImage = (value: number | string): string => {
  const diceNum = typeof value === 'number' ? value : parseInt(value.toString())
  return `/images/dice/${diceNum}.png`
}

// 获取结果文本
const getResultText = (value: number | string): string => {
  if (props.type === 'size') {
    return value === 'big' ? '大' : '小'
  } else if (props.type === 'parity') {
    return value === 'odd' ? '单' : '双'
  } else {
    return value.toString()
  }
}

// 获取单元格样式类
const getCellClass = (value: number | string, index: number): string => {
  const baseClass = `cell-${props.type}`
  
  if (props.type === 'size') {
    return `${baseClass} ${baseClass}-${value}`
  } else if (props.type === 'parity') {
    return `${baseClass} ${baseClass}-${value}`
  } else if (props.type === 'sum') {
    return `${baseClass}`
  }
  
  return baseClass
}

// 窗口尺寸变化时重新计算
const handleResize = () => {
  // 触发重新计算
  visibleResults.value
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>




<style scoped>
.roadmap-row {
  display: flex;
  align-items: center;
  height: 45px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  margin-bottom: 2px;
}

.row-label {
  width: 60px;
  flex-shrink: 0;
  padding: 0 8px;
  background: rgba(74, 159, 110, 0.1);
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.label-text {
  font-size: 12px;
  font-weight: 600;
  color: #4a9f6e;
  text-align: center;
}

.result-columns {
  display: flex;
  gap: 2px;
  flex: 1;
  padding: 0 4px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.result-columns::-webkit-scrollbar {
  display: none;
}

/* 🔥 关键修复：统一所有单元格的宽度 */
.result-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px !important;
  min-width: 40px !important;
  max-width: 40px !important;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

/* 🔥 强制所有类型使用相同宽度 */
.cell-dice,
.cell-size,
.cell-parity,
.cell-sum {
  width: 40px !important;
  min-width: 40px !important;
  max-width: 40px !important;
}

/* 骰子样式 */
.cell-dice {
  background: white;
  border: 1px solid #e1e5e9;
}

.dice-image {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

/* 大小结果样式 */
.cell-size {
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.cell-size-big {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.cell-size-small {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

/* 单双结果样式 */
.cell-parity {
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.cell-parity-odd {
  background: linear-gradient(135deg, #45b7d1, #3498db);
}

.cell-parity-even {
  background: linear-gradient(135deg, #96ceb4, #85c1a5);
}

/* 总和结果样式 */
.cell-sum {
  background: linear-gradient(135deg, #feca57, #ff9ff3);
  color: #2c2c2c;
  font-size: 12px;
  font-weight: 700;
}

.result-text {
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .roadmap-row {
    height: 40px;
  }
  
  .row-label {
    width: 50px;
  }
  
  .label-text {
    font-size: 11px;
  }
  
  .result-cell {
    width: 36px !important;
    min-width: 36px !important;
    max-width: 36px !important;
    height: 32px;
  }
  
  .cell-dice,
  .cell-size,
  .cell-parity,
  .cell-sum {
    width: 36px !important;
    min-width: 36px !important;
    max-width: 36px !important;
  }
  
  .dice-image {
    width: 20px;
    height: 20px;
  }
  
  .cell-size,
  .cell-parity,
  .cell-sum {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .roadmap-row {
    height: 36px;
  }
  
  .row-label {
    width: 45px;
  }
  
  .label-text {
    font-size: 10px;
  }
  
  .result-cell {
    width: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;
    height: 28px;
  }
  
  .cell-dice,
  .cell-size,
  .cell-parity,
  .cell-sum {
    width: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;
  }
  
  .dice-image {
    width: 18px;
    height: 18px;
  }
  
  .cell-size,
  .cell-parity,
  .cell-sum {
    font-size: 10px;
  }
}
</style>