// 音频相关类型定义

// 音频配置
export interface AudioConfig {
  masterVolume: number // 主音量 (0-1)
  musicVolume: number // 音乐音量 (0-1)
  sfxVolume: number // 音效音量 (0-1)
  voiceVolume: number // 语音音量 (0-1)
  ambientVolume: number // 环境音量 (0-1)
  enabled: boolean // 总开关
  musicEnabled: boolean // 音乐开关
  sfxEnabled: boolean // 音效开关
  voiceEnabled: boolean // 语音开关
  ambientEnabled: boolean // 环境音开关
  quality: AudioQuality // 音质设置
  format: AudioFormat // 音频格式偏好
  spatialAudio: boolean // 空间音频
  dynamicRange: boolean // 动态范围压缩
  crossfade: boolean // 交叉淡化
}

export type AudioQuality = 
  | 'low' // 低质量 (32kbps)
  | 'medium' // 中质量 (128kbps) 
  | 'high' // 高质量 (320kbps)
  | 'lossless' // 无损质量

export type AudioFormat = 
  | 'mp3' // MP3格式
  | 'ogg' // OGG格式
  | 'aac' // AAC格式
  | 'wav' // WAV格式
  | 'flac' // FLAC格式

// 音频类别
export type AudioCategory = 
  | 'music' // 音乐
  | 'sfx' // 音效
  | 'voice' // 语音
  | 'ambient' // 环境音
  | 'ui' // 界面音效
  | 'game' // 游戏音效
  | 'notification' // 通知音效

// 音频文件定义
export interface AudioFile {
  id: string
  name: string
  description?: string
  category: AudioCategory
  url: string
  fallbackUrl?: string // 备用URL
  format: AudioFormat
  duration: number // 秒
  size: number // 字节
  bitrate: number // 码率
  sampleRate: number // 采样率
  channels: number // 声道数
  loop: boolean // 是否循环
  preload: boolean // 是否预加载
  volume: number // 默认音量 (0-1)
  fadeIn?: number // 淡入时间（ms）
  fadeOut?: number // 淡出时间（ms）
  crossfadeWith?: string[] // 可与之交叉淡化的音频ID
  tags: string[] // 标签
  metadata?: AudioMetadata
}

export interface AudioMetadata {
  artist?: string
  album?: string
  genre?: string
  year?: number
  composer?: string
  copyright?: string
  language?: string
  mood?: AudioMood
  energy?: AudioEnergy
  tempo?: number // BPM
}

export type AudioMood = 
  | 'calm' // 平静
  | 'exciting' // 兴奋
  | 'tense' // 紧张
  | 'mysterious' // 神秘
  | 'joyful' // 欢快
  | 'dramatic' // 戏剧性
  | 'epic' // 史诗
  | 'melancholic' // 忧郁

export type AudioEnergy = 
  | 'low' // 低能量
  | 'medium' // 中等能量
  | 'high' // 高能量
  | 'very_high' // 极高能量

// 音频实例
export interface AudioInstance {
  id: string // 实例ID
  audioId: string // 音频文件ID
  element: HTMLAudioElement // 音频元素
  context?: AudioContext // 音频上下文
  source?: AudioBufferSourceNode // 音频源节点
  gainNode?: GainNode // 增益节点
  pannerNode?: PannerNode // 声像节点
  analyserNode?: AnalyserNode // 分析节点
  state: AudioState // 播放状态
  volume: number // 当前音量
  currentTime: number // 当前播放时间
  duration: number // 总时长
  playbackRate: number // 播放速率
  loop: boolean // 是否循环
  muted: boolean // 是否静音
  startTime: number // 开始播放时间戳
  pausedAt?: number // 暂停时间戳
  endTime?: number // 预期结束时间
  crossfading?: CrossfadeInfo // 交叉淡化信息
  effects: AudioEffect[] // 音效列表
  metadata: InstanceMetadata // 实例元数据
}

export type AudioState = 
  | 'loading' // 加载中
  | 'loaded' // 已加载
  | 'playing' // 播放中
  | 'paused' // 已暂停
  | 'stopped' // 已停止
  | 'ended' // 播放结束
  | 'error' // 错误状态
  | 'buffering' // 缓冲中

export interface CrossfadeInfo {
  targetInstanceId: string
  duration: number
  startTime: number
  type: CrossfadeType
}

export type CrossfadeType = 
  | 'linear' // 线性
  | 'exponential' // 指数
  | 'logarithmic' // 对数
  | 'sine' // 正弦
  | 'cosine' // 余弦

export interface InstanceMetadata {
  playerId?: string
  gameNumber?: string
  trigger: AudioTrigger
  priority: AudioPriority
  spatial?: SpatialAudioInfo
}

export type AudioTrigger = 
  | 'user_action' // 用户操作
  | 'game_event' // 游戏事件
  | 'ui_interaction' // UI交互
  | 'system_event' // 系统事件
  | 'auto_play' // 自动播放
  | 'scheduled' // 定时播放

export type AudioPriority = 
  | 'low' // 低优先级
  | 'normal' // 普通优先级
  | 'high' // 高优先级
  | 'critical' // 关键优先级

export interface SpatialAudioInfo {
  position: AudioPosition
  orientation?: AudioOrientation
  distance?: number
  rolloffFactor?: number
  dopplerFactor?: number
}

export interface AudioPosition {
  x: number
  y: number
  z: number
}

export interface AudioOrientation {
  x: number
  y: number
  z: number
}

// 音效系统
export interface AudioEffect {
  id: string
  type: AudioEffectType
  enabled: boolean
  parameters: Record<string, number>
  wetness: number // 湿声比例 (0-1)
}

export type AudioEffectType = 
  | 'reverb' // 混响
  | 'delay' // 延迟
  | 'chorus' // 合唱
  | 'flanger' // 镶边
  | 'phaser' // 相位器
  | 'distortion' // 失真
  | 'filter' // 滤波器
  | 'compressor' // 压缩器
  | 'equalizer' // 均衡器
  | 'limiter' // 限制器
  | 'stereo_enhancer' // 立体声增强
  | 'pitch_shift' // 音调偏移

// 音频播放选项
export interface AudioPlayOptions {
  volume?: number // 播放音量
  startTime?: number // 开始时间（秒）
  endTime?: number // 结束时间（秒）
  loop?: boolean // 是否循环
  fadeIn?: number // 淡入时间（ms）
  fadeOut?: number // 淡出时间（ms）
  playbackRate?: number // 播放速率
  crossfade?: CrossfadeOptions // 交叉淡化选项
  spatial?: SpatialAudioInfo // 空间音频信息
  effects?: AudioEffect[] // 音效列表
  priority?: AudioPriority // 优先级
  interruptible?: boolean // 是否可中断
  maxInstances?: number // 最大同时播放实例数
  trigger?: AudioTrigger // 触发原因
  metadata?: Record<string, any> // 额外元数据
}

export interface CrossfadeOptions {
  targetInstanceId?: string
  duration: number
  type: CrossfadeType
  curve?: number[] // 自定义曲线
}

// 音频播放器
export interface AudioPlayer {
  id: string
  name: string
  config: AudioConfig
  instances: Map<string, AudioInstance>
  loadedAudio: Map<string, AudioFile>
  context?: AudioContext
  masterGain?: GainNode
  compressor?: DynamicsCompressorNode
  analyser?: AnalyserNode
  state: PlayerState
  capabilities: PlayerCapabilities
  statistics: PlayerStatistics
}

export type PlayerState = 
  | 'initializing' // 初始化中
  | 'ready' // 就绪
  | 'active' // 活跃
  | 'suspended' // 暂停
  | 'error' // 错误

export interface PlayerCapabilities {
  maxInstances: number
  supportedFormats: AudioFormat[]
  supportsWebAudio: boolean
  supportsPositionalAudio: boolean
  supportsCompression: boolean
  supportsRealTimeEffects: boolean
  maxSampleRate: number
  maxBitrate: number
}

export interface PlayerStatistics {
  totalPlayCount: number
  totalPlayTime: number // 秒
  averageLatency: number // ms
  errorCount: number
  memoryUsage: number // bytes
  cpuUsage: number // percentage
  activeInstances: number
  loadedFiles: number
}

// 音频事件
export interface AudioEvent {
  id: string
  type: AudioEventType
  timestamp: Date
  instanceId?: string
  audioId?: string
  data?: Record<string, any>
  source: EventSource
}

export type AudioEventType = 
  | 'play_started' // 开始播放
  | 'play_paused' // 暂停播放
  | 'play_resumed' // 恢复播放
  | 'play_stopped' // 停止播放
  | 'play_ended' // 播放结束
  | 'volume_changed' // 音量改变
  | 'loading_started' // 开始加载
  | 'loading_completed' // 加载完成
  | 'loading_failed' // 加载失败
  | 'buffer_underrun' // 缓冲区不足
  | 'error_occurred' // 发生错误
  | 'context_state_changed' // 上下文状态改变
  | 'effect_applied' // 音效应用
  | 'crossfade_started' // 交叉淡化开始
  | 'crossfade_completed' // 交叉淡化完成

export type EventSource = 
  | 'user' // 用户
  | 'system' // 系统
  | 'game' // 游戏
  | 'player' // 播放器
  | 'scheduler' // 调度器

// 音频调度器
export interface AudioScheduler {
  id: string
  events: ScheduledAudioEvent[]
  running: boolean
  precision: number // ms
  lookahead: number // ms
}

export interface ScheduledAudioEvent {
  id: string
  audioId: string
  scheduledTime: number // timestamp
  options: AudioPlayOptions
  executed: boolean
  repeat?: RepeatOptions
}

export interface RepeatOptions {
  interval: number // ms
  count?: number // undefined = infinite
  endTime?: number // timestamp
}

// 音频分析
export interface AudioAnalysis {
  instanceId: string
  timestamp: Date
  volume: VolumeAnalysis
  frequency: FrequencyAnalysis
  tempo?: TempoAnalysis
  pitch?: PitchAnalysis
}

export interface VolumeAnalysis {
  rms: number // RMS音量
  peak: number // 峰值音量
  lufs?: number // LUFS响度
}

export interface FrequencyAnalysis {
  spectrum: Float32Array // 频谱数据
  fundamentalFreq?: number // 基频
  harmonics?: number[] // 谐波
  centroid: number // 频谱质心
  bandwidth: number // 频谱带宽
}

export interface TempoAnalysis {
  bpm: number // 节拍
  confidence: number // 置信度
  timeSignature?: [number, number] // 拍号
}

export interface PitchAnalysis {
  fundamental: number // 基音频率
  pitch: string // 音高名称 (C4, D#5, etc.)
  cents: number // 音分偏差
  confidence: number // 置信度
}

// 音频预设
export interface AudioPreset {
  id: string
  name: string
  description: string
  category: PresetCategory
  config: Partial<AudioConfig>
  effects: AudioEffect[]
  spatialSettings?: SpatialPreset
  tags: string[]
  author?: string
  version: string
  createdAt: Date
  updatedAt: Date
}

export type PresetCategory = 
  | 'general' // 通用
  | 'gaming' // 游戏
  | 'music' // 音乐
  | 'movie' // 电影
  | 'voice' // 语音
  | 'custom' // 自定义

export interface SpatialPreset {
  roomSize: number
  roomType: RoomType
  listenerPosition: AudioPosition
  sourcePositions: Record<string, AudioPosition>
}

export type RoomType = 
  | 'small_room' // 小房间
  | 'medium_room' // 中等房间
  | 'large_room' // 大房间
  | 'hall' // 大厅
  | 'cathedral' // 教堂
  | 'outdoor' // 户外

// 音频缓存
export interface AudioCache {
  size: number // 当前缓存大小（bytes）
  maxSize: number // 最大缓存大小（bytes）
  files: Map<string, CachedAudioFile>
  strategy: CacheStrategy
  statistics: CacheStatistics
}

export interface CachedAudioFile {
  audioId: string
  data: ArrayBuffer
  lastAccessed: Date
  accessCount: number
  size: number
  priority: CachePriority
}

export type CacheStrategy = 
  | 'lru' // 最近最少使用
  | 'lfu' // 最不经常使用
  | 'fifo' // 先进先出
  | 'priority' // 优先级

export type CachePriority = 
  | 'low' // 低优先级
  | 'normal' // 普通优先级  
  | 'high' // 高优先级
  | 'permanent' // 永久

export interface CacheStatistics {
  hitRate: number // 命中率
  missRate: number // 未命中率
  evictionCount: number // 驱逐次数
  totalRequests: number // 总请求数
}

// 音频错误
export interface AudioError {
  id: string
  type: AudioErrorType
  message: string
  code?: string
  audioId?: string
  instanceId?: string
  timestamp: Date
  stack?: string
  metadata?: Record<string, any>
}

export type AudioErrorType = 
  | 'load_error' // 加载错误
  | 'play_error' // 播放错误
  | 'context_error' // 上下文错误
  | 'format_error' // 格式错误
  | 'network_error' // 网络错误
  | 'permission_error' // 权限错误
  | 'decode_error' // 解码错误
  | 'hardware_error' // 硬件错误

// 音频通知
export interface AudioNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  audioId?: string
  instanceId?: string
  timestamp: Date
  duration?: number // ms
  actions?: NotificationAction[]
  priority: NotificationPriority
}

export type NotificationType = 
  | 'info' // 信息
  | 'warning' // 警告
  | 'error' // 错误
  | 'success' // 成功

export type NotificationPriority = 
  | 'low' // 低
  | 'normal' // 普通
  | 'high' // 高
  | 'urgent' // 紧急

export interface NotificationAction {
  id: string
  label: string
  action: () => void
}

// 音频设备信息
export interface AudioDeviceInfo {
  id: string
  name: string
  type: DeviceType
  channels: number
  sampleRate: number
  bufferSize: number
  latency: number // ms
  isDefault: boolean
  isAvailable: boolean
}

export type DeviceType = 
  | 'input' // 输入设备
  | 'output' // 输出设备

// 导出所有类型的联合类型
export type AllAudioTypes = 
  | AudioQuality
  | AudioFormat
  | AudioCategory
  | AudioMood
  | AudioEnergy
  | AudioState
  | CrossfadeType
  | AudioTrigger
  | AudioPriority
  | AudioEffectType
  | PlayerState
  | AudioEventType
  | EventSource
  | PresetCategory
  | RoomType
  | CacheStrategy
  | CachePriority
  | AudioErrorType
  | NotificationType
  | NotificationPriority
  | DeviceType