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
const calculateVisibleColumns = () => {
  if (!columnsContainer.value) return props.maxColumns
  
  const containerWidth = columnsContainer.value.clientWidth
  const columnWidth = props.type === 'dice' ? 45 : 40  // 骰子列稍宽一些
  const gap = 2  // 列间距
  
  const maxColumns = Math.floor((containerWidth + gap) / (columnWidth + gap))
  return Math.min(Math.max(1, maxColumns), props.maxColumns)
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

.result-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 36px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

/* 骰子样式 */
.cell-dice {
  background: white;
  border: 1px solid #e1e5e9;
  min-width: 42px;
}

.dice-image {
  width: 28px;
  height: 28px;
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
    min-width: 36px;
    height: 32px;
  }
  
  .cell-dice {
    min-width: 38px;
  }
  
  .dice-image {
    width: 24px;
    height: 24px;
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
    min-width: 32px;
    height: 28px;
  }
  
  .cell-dice {
    min-width: 34px;
  }
  
  .dice-image {
    width: 20px;
    height: 20px;
  }
  
  .cell-size,
  .cell-parity,
  .cell-sum {
    font-size: 10px;
  }
}
</style>