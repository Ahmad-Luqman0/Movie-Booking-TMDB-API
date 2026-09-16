import React from 'react';
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

interface TrailerModalProps {
  visible: boolean;
  movieTitle: string;
  trailerKey?: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({
  visible,
  movieTitle,
  trailerKey,
  onClose,
}) => {

  //Watch Trailer Button
  const handleWatchOnYouTube = () => {
    if (trailerKey) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
    } else {
      Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(movieTitle + ' official trailer')}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {movieTitle} Trailer
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Video Placeholder / Launch Surface */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWatchOnYouTube}
            style={styles.videoPlayer}
          >
            <View style={styles.playCircle}>
              <Ionicons name="play" size={32} color={COLORS.textLight} style={{ marginLeft: 4 }} />
            </View>
            <Text style={styles.videoStatus}>Official TMDB Trailer</Text>
            <Text style={styles.videoSub}>Tap to play video on YouTube</Text>
          </TouchableOpacity>

          {/* Close Action */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.doneText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  videoPlayer: {
    height: 200,
    backgroundColor: COLORS.darkNavy,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  videoStatus: {
    color: COLORS.textLight,
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  videoSub: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 12,
    marginTop: 2,
  },
  doneButton: {
    marginTop: 16,
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.textLight,
  },
});
