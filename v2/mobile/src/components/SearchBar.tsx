import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onDebouncedSearch?: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onDebouncedSearch,
  onClear,
  placeholder = 'TV shows, movies and more',
  autoFocus = false,
}) => {
  const [internalText, setInternalText] = useState(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInternalText(value);
  }, [value]);

  const handleChange = (text: string) => {
    setInternalText(text);
    onChangeText(text);

    if (onDebouncedSearch) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        onDebouncedSearch(text);
      }, 300); // 300ms debounce as specified in acceptance criteria
    }
  };

  const handleClear = () => {
    setInternalText('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    onClear();
  };

  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={20}
        color={COLORS.textPrimary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={internalText}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.inputPlaceholder}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {internalText.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearButton}
        >
          <Ionicons name="close" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 52,
    width: '100%',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
});
