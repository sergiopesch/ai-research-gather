import { Brain, Bot, Eye, Cpu, Network, Sparkles, Database, Shield, Zap, Globe } from 'lucide-react';
import type { ResearchArea } from '@/types/research';

export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'ai',
    label: 'Artificial Intelligence',
    icon: Brain,
    keywords: [
      'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning', 'neural network',
      'transformer', 'supervised learning', 'unsupervised learning', 'classification',
      'regression', 'clustering', 'generative', 'discriminative', 'attention', 'embedding'
    ],
    color: 'text-indigo-600',
    gradient: 'bg-indigo-50',
    colorClass: 'ai'
  },
  {
    id: 'robotics',
    label: 'Robotics',
    icon: Bot,
    keywords: [
      'robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam',
      'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 'path planning',
      'localization', 'mapping', 'control', 'actuator', 'sensor fusion', 'kinematics'
    ],
    color: 'text-pink-600',
    gradient: 'bg-pink-50',
    colorClass: 'robotics'
  },
  {
    id: 'cv',
    label: 'Computer Vision',
    icon: Eye,
    keywords: [
      'computer vision', 'image processing', 'visual', 'vision', 'opencv', 'segmentation',
      'detection', 'recognition', 'cnn', 'yolo', 'object detection', 'image classification',
      'face recognition', 'optical', 'pixel', 'convolution', 'feature extraction', 'tracking'
    ],
    color: 'text-green-600',
    gradient: 'bg-green-50',
    colorClass: 'cv'
  },
  {
    id: 'nlp',
    label: 'Natural Language',
    icon: Sparkles,
    keywords: [
      'natural language processing', 'nlp', 'text mining', 'sentiment analysis', 'named entity',
      'machine translation', 'question answering', 'text generation', 'summarization',
      'chatbot', 'dialogue', 'speech recognition', 'language understanding', 'semantic'
    ],
    color: 'text-purple-600',
    gradient: 'bg-purple-50',
    colorClass: 'nlp'
  },
  {
    id: 'llm',
    label: 'Large Language Models',
    icon: Network,
    keywords: [
      'large language model', 'llm', 'gpt', 'claude', 'llama', 'mistral', 'gemini',
      'foundation model', 'pre-training', 'fine-tuning', 'prompt engineering', 'rag',
      'retrieval augmented', 'instruction tuning', 'alignment', 'rlhf', 'chain of thought'
    ],
    color: 'text-orange-600',
    gradient: 'bg-orange-50',
    colorClass: 'llm'
  },
  {
    id: 'multimodal',
    label: 'Multimodal AI',
    icon: Globe,
    keywords: [
      'multimodal', 'vision language', 'clip', 'dall-e', 'stable diffusion', 'midjourney',
      'image generation', 'text to image', 'video generation', 'audio visual',
      'cross modal', 'vision transformer', 'diffusion model', 'generative ai'
    ],
    color: 'text-cyan-600',
    gradient: 'bg-cyan-50',
    colorClass: 'multimodal'
  },
  {
    id: 'agents',
    label: 'AI Agents',
    icon: Cpu,
    keywords: [
      'ai agent', 'autonomous agent', 'multi-agent', 'agent system', 'tool use',
      'planning', 'reasoning', 'decision making', 'task automation', 'agentic',
      'self-improvement', 'cognitive architecture', 'goal-oriented'
    ],
    color: 'text-rose-600',
    gradient: 'bg-rose-50',
    colorClass: 'agents'
  },
  {
    id: 'mlops',
    label: 'MLOps & Infrastructure',
    icon: Database,
    keywords: [
      'mlops', 'machine learning operations', 'model deployment', 'model serving',
      'distributed training', 'gpu cluster', 'inference optimization', 'quantization',
      'pruning', 'knowledge distillation', 'edge ai', 'tinyml', 'model compression'
    ],
    color: 'text-sky-600',
    gradient: 'bg-sky-50',
    colorClass: 'mlops'
  },
  {
    id: 'safety',
    label: 'AI Safety & Ethics',
    icon: Shield,
    keywords: [
      'ai safety', 'alignment', 'interpretability', 'explainability', 'fairness',
      'bias', 'robustness', 'adversarial', 'trustworthy ai', 'responsible ai',
      'ethics', 'governance', 'regulation', 'transparency', 'accountability'
    ],
    color: 'text-amber-600',
    gradient: 'bg-amber-50',
    colorClass: 'safety'
  },
  {
    id: 'rl',
    label: 'Reinforcement Learning',
    icon: Zap,
    keywords: [
      'reinforcement learning', 'rl', 'reward', 'policy gradient', 'q-learning',
      'actor-critic', 'ppo', 'dqn', 'exploration', 'exploitation', 'markov',
      'bandit', 'monte carlo', 'temporal difference', 'value function'
    ],
    color: 'text-emerald-600',
    gradient: 'bg-emerald-50',
    colorClass: 'rl'
  }
];

// Topic groups for granular selection
export interface TopicItem {
  id: string;
  label: string;
  areaId: string;
}

export const TOPIC_ITEMS: TopicItem[] = [
  // AI Topics
  { id: 'deep-learning', label: 'Deep Learning', areaId: 'ai' },
  { id: 'neural-networks', label: 'Neural Networks', areaId: 'ai' },
  { id: 'transformers', label: 'Transformers', areaId: 'ai' },
  { id: 'classification', label: 'Classification', areaId: 'ai' },

  // Robotics Topics
  { id: 'manipulation', label: 'Robot Manipulation', areaId: 'robotics' },
  { id: 'navigation', label: 'Navigation & SLAM', areaId: 'robotics' },
  { id: 'humanoid', label: 'Humanoid Robots', areaId: 'robotics' },
  { id: 'drones', label: 'Drones & UAV', areaId: 'robotics' },

  // Computer Vision Topics
  { id: 'object-detection', label: 'Object Detection', areaId: 'cv' },
  { id: 'segmentation', label: 'Image Segmentation', areaId: 'cv' },
  { id: 'face-recognition', label: 'Face Recognition', areaId: 'cv' },
  { id: 'tracking', label: 'Object Tracking', areaId: 'cv' },

  // NLP Topics
  { id: 'sentiment', label: 'Sentiment Analysis', areaId: 'nlp' },
  { id: 'translation', label: 'Machine Translation', areaId: 'nlp' },
  { id: 'summarization', label: 'Text Summarization', areaId: 'nlp' },
  { id: 'qa', label: 'Question Answering', areaId: 'nlp' },

  // LLM Topics
  { id: 'fine-tuning', label: 'Fine-tuning', areaId: 'llm' },
  { id: 'prompting', label: 'Prompt Engineering', areaId: 'llm' },
  { id: 'rag', label: 'RAG Systems', areaId: 'llm' },
  { id: 'alignment', label: 'Alignment & RLHF', areaId: 'llm' },

  // Multimodal Topics
  { id: 'text-to-image', label: 'Text to Image', areaId: 'multimodal' },
  { id: 'vision-language', label: 'Vision-Language', areaId: 'multimodal' },
  { id: 'diffusion', label: 'Diffusion Models', areaId: 'multimodal' },
  { id: 'video-gen', label: 'Video Generation', areaId: 'multimodal' },

  // AI Agents Topics
  { id: 'tool-use', label: 'Tool Use', areaId: 'agents' },
  { id: 'multi-agent', label: 'Multi-Agent Systems', areaId: 'agents' },
  { id: 'planning', label: 'Planning & Reasoning', areaId: 'agents' },
  { id: 'task-automation', label: 'Task Automation', areaId: 'agents' },

  // MLOps Topics
  { id: 'deployment', label: 'Model Deployment', areaId: 'mlops' },
  { id: 'optimization', label: 'Inference Optimization', areaId: 'mlops' },
  { id: 'edge-ai', label: 'Edge AI', areaId: 'mlops' },
  { id: 'distributed', label: 'Distributed Training', areaId: 'mlops' },

  // Safety Topics
  { id: 'interpretability', label: 'Interpretability', areaId: 'safety' },
  { id: 'fairness', label: 'Fairness & Bias', areaId: 'safety' },
  { id: 'adversarial', label: 'Adversarial Robustness', areaId: 'safety' },
  { id: 'governance', label: 'AI Governance', areaId: 'safety' },

  // RL Topics
  { id: 'policy-gradient', label: 'Policy Gradient', areaId: 'rl' },
  { id: 'q-learning', label: 'Q-Learning', areaId: 'rl' },
  { id: 'exploration', label: 'Exploration Strategies', areaId: 'rl' },
  { id: 'multi-agent-rl', label: 'Multi-Agent RL', areaId: 'rl' },
];
