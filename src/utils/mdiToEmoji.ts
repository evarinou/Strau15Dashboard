// Map MDI icon names to emojis
const mdiToEmojiMap: Record<string, string> = {
  // Achievement icons
  'mdi:star': '⭐',
  'mdi:star-outline': '⭐',
  'mdi:trophy': '🏆',
  'mdi:trophy-outline': '🏆',
  'mdi:medal': '🥇',
  'mdi:medal-outline': '🥇',
  'mdi:crown': '👑',
  'mdi:crown-outline': '👑',
  'mdi:fire': '🔥',
  'mdi:lightning-bolt': '⚡',
  'mdi:rocket': '🚀',
  'mdi:rocket-launch': '🚀',
  'mdi:party-popper': '🎉',
  'mdi:cake': '🎂',
  'mdi:gift': '🎁',
  'mdi:heart': '❤️',
  'mdi:heart-outline': '💖',

  // Room/Task icons
  'mdi:chef-hat': '👨‍🍳',
  'mdi:broom': '🧹',
  'mdi:vacuum': '🧹',
  'mdi:washing-machine': '🧺',
  'mdi:silverware-fork-knife': '🍴',
  'mdi:bed': '🛏️',
  'mdi:shower': '🚿',
  'mdi:sofa': '🛋️',
  'mdi:desk': '🖥️',
  'mdi:table-furniture': '🪑',
  'mdi:flower': '🌸',
  'mdi:tree': '🌳',
  'mdi:car': '🚗',
  'mdi:tools': '🔧',
  'mdi:hammer': '🔨',

  // General
  'mdi:check': '✅',
  'mdi:check-circle': '✅',
  'mdi:close': '❌',
  'mdi:clock': '⏰',
  'mdi:calendar': '📅',
  'mdi:account': '👤',
  'mdi:account-group': '👥',
  'mdi:home': '🏠',
  'mdi:room': '🚪',

  // Fallback
  'default': '🏅',
}

export function mdiToEmoji(mdiIcon: string | null | undefined): string {
  if (!mdiIcon) return mdiToEmojiMap['default']

  // Handle both "mdi:icon-name" and just "icon-name" formats
  const normalizedIcon = mdiIcon.startsWith('mdi:') ? mdiIcon : `mdi:${mdiIcon}`

  return mdiToEmojiMap[normalizedIcon] || mdiToEmojiMap['default']
}
