import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchMyHelpRequests, createHelpRequest } from '../../api/help';

export default function HelpSupportScreen({ navigation }) {
  const [message, setMessage] = useState('');
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [ticketDetailVisible, setTicketDetailVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const getStatusMeta = (statusValue) => {
    const normalized = String(statusValue || '').trim().toLowerCase();
    if (normalized === 'closed') {
      return {
        label: 'Closed',
        bg: '#FEE2E2',
        text: '#B91C1C',
      };
    }
    return {
      label: 'Open',
      bg: '#DCFCE7',
      text: '#166534',
    };
  };

  const loadHelpRequests = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchMyHelpRequests();
      setHelpRequests(data);
      setError(null);
    } catch (e) {
      setError('Failed to load help requests');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadHelpRequests();
  }, []);

  const handleAddHelp = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await createHelpRequest(message.trim());
      setMessage('');
      setTicketModalVisible(false);
      await loadHelpRequests();
    } catch (e) {
      setError('Failed to submit help request');
    }
    setSubmitting(false);
  };

  
  const onRefresh = () => {
    loadHelpRequests(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        
        <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#FFF' }]}>Help & Support</Text>
            <View style={styles.backBtnPlaceholder} />
          </View>
        </LinearGradient>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.actionsWrap}>
            <TouchableOpacity
              style={styles.createTicketBtn}
              onPress={() => {
                setError(null);
                setTicketModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.createTicketBtnText}>Create New Ticket</Text>
            </TouchableOpacity>
            {error && <Text style={styles.error}>{error}</Text>}
          </View>

          <View style={styles.listCard}>
            <Text style={styles.listTitle}>My Requests</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 24 }} />
            ) : helpRequests.length === 0 ? (
              <Text style={styles.emptyText}>No help requests yet.</Text>
            ) : (
              <FlatList
                data={helpRequests}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                keyExtractor={item => item._id}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const statusMeta = getStatusMeta(item?.status);
                  return (
                  <TouchableOpacity
                    style={styles.helpItem}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedTicket(item);
                      setTicketDetailVisible(true);
                    }}
                  >
                    <MaterialCommunityIcons name="message-question-outline" size={20} color="#1D4ED8" style={{ marginRight: 8, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemTopRow}>
                        <Text style={styles.helpDate}>{new Date(item.createdAt).toLocaleString()}</Text>
                        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}> 
                          <Text style={[styles.statusPillText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.helpMessage}>{item.message}</Text>
                    </View>
                  </TouchableOpacity>
                )}}
              />
            )}
          </View>
        </KeyboardAvoidingView>

        <Modal
          visible={ticketModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setTicketModalVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setTicketModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#1D4ED8" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Ticket</Text>
              <View style={styles.backBtnPlaceholder} />
            </View>

            <KeyboardAvoidingView style={styles.modalBody} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Text style={styles.modalTitle}>Write your message</Text>
              <Text style={styles.modalSubTitle}>Describe your issue in detail and submit.</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Type your message..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setTicketModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleAddHelp}
                  disabled={submitting || !message.trim()}
                >
                  <MaterialCommunityIcons name="send" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.submitBtnText}>{submitting ? 'Sending...' : 'Submit Ticket'}</Text>
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.error}>{error}</Text>}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={ticketDetailVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setTicketDetailVisible(false)}
        >
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeaderRow}>
                <Text style={styles.detailTitle}>Ticket Details</Text>
                <TouchableOpacity onPress={() => setTicketDetailVisible(false)} style={styles.detailCloseBtn}>
                  <MaterialCommunityIcons name="close" size={20} color="#334155" />
                </TouchableOpacity>
              </View>

              {selectedTicket && (
                <>
                  <View style={styles.detailStatusRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: getStatusMeta(selectedTicket.status).bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color: getStatusMeta(selectedTicket.status).text,
                          },
                        ]}
                      >
                        {getStatusMeta(selectedTicket.status).label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailLabel}>Created At</Text>
                  <Text style={styles.detailValue}>{new Date(selectedTicket.createdAt).toLocaleString()}</Text>

                  <Text style={styles.detailLabel}>Message</Text>
                  <Text style={styles.detailMessage}>{selectedTicket.message || '-'}</Text>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20 },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  actionsWrap: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  createTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    minHeight: 44,
  },
  createTicketBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 46,
    flex: 1,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'left',
  },
  listCard: {
    flex: 1,
    margin: 18,
    marginTop: 8,
    padding: 0,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
    marginBottom: 10,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  helpMessage: {
    color: '#0F172A',
    fontSize: 15,
    marginBottom: 2,
  },
  helpDate: {
    color: '#64748B',
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubTitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  modalInput: {
    marginTop: 14,
    flex: 1,
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 15,
  },
  modalActionRow: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  detailCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  detailCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  detailMessage: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
