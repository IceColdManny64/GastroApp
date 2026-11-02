import { useState, useEffect } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DEFAULT_RECIPE_IMAGE } from '../../services/recipes';

export interface CardProps {
  title: string;
  image: string;
  description: string;
  category: string;
  difficulty: string;
  prepareTime: string;
  likeRate: number;
  isFavorite?: boolean;
  compact?: boolean;
  darkMode?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
}

const getDifficultyColors = (difficulty: string, darkMode: boolean) => {
  const normalized = difficulty.toLowerCase();
  if (normalized.includes('dificil')) {
    return darkMode
      ? { bg: '#3A1F1E', text: '#EC7063' }
      : { bg: '#FDEDEC', text: '#C0392B' };
  }
  if (normalized.includes('medio')) {
    return darkMode
      ? { bg: '#33261A', text: '#F5B041' }
      : { bg: '#FEF5E7', text: '#B9770E' };
  }
  return darkMode
    ? { bg: '#1B3124', text: '#58D68D' }
    : { bg: '#E8F8F0', text: '#1E8449' };
};

const Card = ({
  title,
  image,
  description,
  category,
  difficulty,
  prepareTime,
  likeRate,
  isFavorite = false,
  compact = false,
  darkMode = false,
  onToggleFavorite,
  onPress,
}: CardProps) => {
  const [imageSourceUri, setImageSourceUri] = useState(image || DEFAULT_RECIPE_IMAGE);

  useEffect(() => {
    setImageSourceUri(image || DEFAULT_RECIPE_IMAGE);
  }, [image]);

  const diffColors = getDifficultyColors(difficulty, darkMode);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        darkMode && styles.cardDark,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: imageSourceUri }}
          style={[
            styles.image,
            compact && styles.imageCompact,
            darkMode && styles.imageDark,
          ]}
          onError={() => setImageSourceUri(DEFAULT_RECIPE_IMAGE)}
        />
        <View style={[styles.categoryBadge, darkMode && styles.categoryBadgeDark]}>
          <Text style={styles.categoryBadgeText}>{category}</Text>
        </View>
        {onToggleFavorite && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            style={[
              styles.favoriteButton,
              darkMode && styles.favoriteButtonDark,
              isFavorite &&
                (darkMode
                  ? styles.favoriteButtonActiveDark
                  : styles.favoriteButtonActive),
            ]}
            accessibilityLabel={
              isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
            }
          >
            <Text
              style={[
                styles.favoriteIcon,
                darkMode && styles.favoriteIconDark,
                isFavorite &&
                  (darkMode
                    ? styles.favoriteIconActiveDark
                    : styles.favoriteIconActive),
              ]}
            >
              {isFavorite ? '♥' : '♡'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, darkMode && styles.titleDark]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.description, darkMode && styles.descriptionDark]}
          numberOfLines={compact ? 1 : 2}
        >
          {description}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.timePill, darkMode && styles.timePillDark]}>
            <Text
              style={[styles.timePillText, darkMode && styles.timePillTextDark]}
            >
              ⏱️ {prepareTime}
            </Text>
          </View>

          <View
            style={[
              styles.difficultyPill,
              { backgroundColor: diffColors.bg },
            ]}
          >
            <Text style={[styles.difficultyPillText, { color: diffColors.text }]}>
              {difficulty}
            </Text>
          </View>

          <View style={[styles.likePill, darkMode && styles.likePillDark]}>
            <Text
              style={[styles.likePillText, darkMode && styles.likePillTextDark]}
            >
              👍 {likeRate}%
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

export default Card;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEBE9',
    ...Platform.select({
      web: {
        boxShadow: '0px 3px 8px rgba(79, 44, 33, 0.12)',
      },
      default: {
        shadowColor: '#4f2c21',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  cardDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  image: {
    height: 200,
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: '#E5DDD9',
  },
  imageDark: {
    backgroundColor: '#181312',
  },
  imageCompact: {
    height: 130,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(117, 51, 51, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryBadgeDark: {
    backgroundColor: 'rgba(231, 76, 60, 0.92)',
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonDark: {
    backgroundColor: 'rgba(36, 29, 27, 0.92)',
    borderWidth: 1,
    borderColor: '#4A3833',
  },
  favoriteButtonActive: {
    backgroundColor: '#FDEDEC',
  },
  favoriteButtonActiveDark: {
    backgroundColor: '#3A1F1E',
    borderColor: '#E74C3C',
  },
  favoriteIcon: {
    fontSize: 18,
    color: '#555555',
  },
  favoriteIconDark: {
    color: '#B8A9A4',
  },
  favoriteIconActive: {
    color: '#C0392B',
  },
  favoriteIconActiveDark: {
    color: '#EC7063',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C1E1B',
    marginBottom: 6,
  },
  titleDark: {
    color: '#F7F2F0',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555555',
  },
  descriptionDark: {
    color: '#B8A9A4',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  timePill: {
    backgroundColor: '#FEF5E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timePillDark: {
    backgroundColor: '#33261A',
  },
  timePillText: {
    color: '#B9770E',
    fontSize: 12,
    fontWeight: '600',
  },
  timePillTextDark: {
    color: '#F5B041',
  },
  difficultyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  likePill: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likePillDark: {
    backgroundColor: '#1B3124',
  },
  likePillText: {
    color: '#27AE60',
    fontSize: 12,
    fontWeight: '700',
  },
  likePillTextDark: {
    color: '#58D68D',
  },
});
