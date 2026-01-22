import { Bot, Eye, Network } from 'lucide-react';
import type { ResearchArea } from '@/types/research';

export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'robotics',
    label: 'Robotics',
    icon: Bot,
    keywords: [
      'robotics', 'robot', 'autonomous', 'robotic', 'manipulation', 'navigation', 'slam',
      'motion planning', 'humanoid', 'drone', 'uav', 'mobile robot', 'path planning',
      'localization', 'mapping', 'control', 'actuator', 'sensor fusion', 'kinematics'
    ],
    color: 'text-neutral-900',
    gradient: 'bg-neutral-50',
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
    color: 'text-neutral-900',
    gradient: 'bg-neutral-50',
    colorClass: 'cv'
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
    color: 'text-neutral-900',
    gradient: 'bg-neutral-50',
    colorClass: 'llm'
  }
];

// Topic groups for granular selection
export interface TopicItem {
  id: string;
  label: string;
  areaId: string;
}

export const TOPIC_ITEMS: TopicItem[] = [
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

  // LLM Topics
  { id: 'fine-tuning', label: 'Fine-tuning', areaId: 'llm' },
  { id: 'prompting', label: 'Prompt Engineering', areaId: 'llm' },
  { id: 'rag', label: 'RAG Systems', areaId: 'llm' },
  { id: 'alignment', label: 'Alignment & RLHF', areaId: 'llm' },
];
