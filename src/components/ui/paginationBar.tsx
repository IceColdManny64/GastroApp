import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PageSizeOption } from '../../types/Auth';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: PageSizeOption;
  darkMode?: boolean;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: PageSizeOption) => void;
}

const PAGE_SIZE_OPTIONS: PageSizeOption[] = [10, 20, 30];

export default function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  darkMode = false,
  onPageChange,
  onItemsPerPageChange,
}: PaginationBarProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <View style={[styles.pageSizeRow, darkMode && styles.pageSizeRowDark]}>
        <Text style={[styles.label, darkMode && styles.labelDark]}>
          Elementos por página:
        </Text>
        <View style={styles.sizeButtonsGroup}>
          {PAGE_SIZE_OPTIONS.map((size) => {
            const isSelected = itemsPerPage === size;
            return (
              <Pressable
                key={size}
                onPress={() => onItemsPerPageChange(size)}
                style={[
                  styles.sizeButton,
                  darkMode && styles.sizeButtonDark,
                  isSelected && styles.sizeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.sizeButtonText,
                    darkMode && styles.sizeButtonTextDark,
                    isSelected && styles.sizeButtonTextActive,
                  ]}
                >
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => canGoPrev && onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          style={[
            styles.navButton,
            !canGoPrev && styles.navButtonDisabled,
          ]}
        >
          <Text style={styles.navButtonText}>Anterior</Text>
        </Pressable>

        <View style={styles.pageInfo}>
          <Text style={[styles.pageInfoPrimary, darkMode && styles.labelDark]}>
            Página {currentPage} de {totalPages}
          </Text>
          <Text style={[styles.pageInfoSecondary, darkMode && styles.subLabelDark]}>
            Mostrando {startItem}-{endItem} de {totalItems}
          </Text>
        </View>

        <Pressable
          onPress={() => canGoNext && onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          style={[
            styles.navButton,
            !canGoNext && styles.navButtonDisabled,
          ]}
        >
          <Text style={styles.navButtonText}>Siguiente</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAE2DF',
  },
  containerDark: {
    backgroundColor: '#241D1B',
    borderColor: '#382E2B',
  },
  pageSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAE7',
  },
  pageSizeRowDark: {
    borderBottomColor: '#382E2B',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3833',
  },
  labelDark: {
    color: '#F7F2F0',
  },
  subLabelDark: {
    color: '#B8A9A4',
  },
  sizeButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3ECE9',
    borderWidth: 1,
    borderColor: '#E2D6D1',
  },
  sizeButtonDark: {
    backgroundColor: '#181312',
    borderColor: '#382E2B',
  },
  sizeButtonActive: {
    backgroundColor: '#C0392B',
    borderColor: '#C0392B',
  },
  sizeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A3833',
  },
  sizeButtonTextDark: {
    color: '#B8A9A4',
  },
  sizeButtonTextActive: {
    color: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#753333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageInfoPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1E1B',
  },
  pageInfoSecondary: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});
