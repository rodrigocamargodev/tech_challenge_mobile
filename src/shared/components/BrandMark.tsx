import { Image, StyleSheet } from 'react-native';

/**
 * Marca do Blog de Giz (giz escrevendo sobre a lousa).
 *
 * Usa o asset de splash, que tem fundo transparente — assim a marca se adapta
 * tanto ao verde-lousa quanto às superfícies claras.
 *
 * Acessibilidade: a imagem é **decorativa**. O nome do aplicativo já é
 * anunciado pelo título ao lado, então marcar a imagem como acessível geraria
 * anúncio duplicado no TalkBack/VoiceOver.
 */
const marca = require('../../../assets/splash-icon.png');

export interface BrandMarkProps {
  /** Lado da imagem em pontos. */
  size?: number;
  testID?: string;
}

export function BrandMark({ size = 64, testID }: BrandMarkProps) {
  return (
    <Image
      source={marca}
      testID={testID}
      style={[styles.imagem, { width: size, height: size }]}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

const styles = StyleSheet.create({
  imagem: {
    alignSelf: 'flex-start',
  },
});
