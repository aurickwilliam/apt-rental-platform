import { Pressable } from 'react-native'
import { IconLanguage } from '@tabler/icons-react-native'

import { ALLOW_FILIPINO } from '@repo/i18n'

import { useColors } from 'hooks/useTheme'
import { useTranslation } from '@/hooks/i18n/useTranslation'

/**
 * The language switch on auth screens. Signing in is not required to read a
 * screen, so the choice is reachable before the account exists. Renders
 * nothing while the rollout flag is off.
 */
export default function AuthLanguageToggle() {
  const { language, setLanguage, t } = useTranslation()
  const { colors } = useColors()

  if (!ALLOW_FILIPINO) return null

  const next = language === 'fil' ? 'en' : 'fil'
  const label =
    next === 'fil'
      ? t('settings.languageSwitch.toFilipino')
      : t('settings.languageSwitch.toEnglish')

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => setLanguage(next)}
      className='h-10 w-10 items-center justify-center rounded-full'
    >
      <IconLanguage size={22} color={colors.textPrimary} />
    </Pressable>
  )
}
