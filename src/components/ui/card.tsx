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

const getDifficultyColors = (difficulty: string) => {
  const normalized = difficulty.toLowerCase();
  if (normalized.includes('dificil')) {
    return { bg: '#FDEDEC', text: '#C0392B' };
  }
  if (normalized.includes('medio')) {
    return { bg: '#FEF5E7', text: '#B9770E' };
  }
  return { bg: '#E8F8F0', text: '#1E8449' };
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

  const diffColors = getDifficultyColors(difficulty);

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
          style={[styles.image, compact && styles.imageCompact]}
          onError={() => setImageSourceUri(DEFAULT_RECIPE_IMAGE)}
        />
        <View style={styles.categoryBadge}>
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
              isFavorite && styles.favoriteButtonActive,
            ]}
            accessibilityLabel={
              isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
            }
          >
            <Text
              style={[
                styles.favoriteIcon,
                isFavorite && styles.favoriteIconActive,
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
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>⏱️ {prepareTime}</Text>
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

          <View style={styles.likePill}>
            <Text style={styles.likePillText}>👍 {likeRate}%</Text>
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
  imageCompact: {
    height: 130,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(117, 51, 51, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
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
  favoriteButtonActive: {
    backgroundColor: '#FDEDEC',
  },
  favoriteIcon: {
    fontSize: 18,
    color: '#555555',
  },
  favoriteIconActive: {
    color: '#C0392B',
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
  timePillText: {
    color: '#B9770E',
    fontSize: 12,
    fontWeight: '600',
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
  likePillText: {
    color: '#27AE60',
    fontSize: 12,
    fontWeight: '700',
  },
});
