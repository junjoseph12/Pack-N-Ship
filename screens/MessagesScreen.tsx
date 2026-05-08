import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

const MOCK_CHATS = [
  { id: 'm1', name: 'Jun Joseph Pestaño', lastMsg: 'On my way to pickup!', time: '2 min ago' },
  { id: 'm2', name: 'Support Team', lastMsg: 'Your delivery has been scheduled.', time: '11:23 AM' },
  { id: 'm3', name: 'Maria Santos', lastMsg: 'Thank you! Received.', time: 'Yesterday' },
  { id: 'm4', name: 'LBC Express', lastMsg: 'Package dropoff confirmed.', time: 'Mon' },
];

export default function MessagesScreen({ navigation }: any) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const fetchChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setChats(MOCK_CHATS);
      setLoading(false);
      return;
    }
    const { data: userRecord } = await supabase.from('users').select('user_id').eq('auth_id', user.id).single();
    if (!userRecord) {
      setChats(MOCK_CHATS);
      setLoading(false);
      return;
    }

    const { data: rooms } = await supabase
      .from('deliveries')
      .select(`
        delivery_id,
        request:delivery_requests!inner(sender_id, provider_id)
      `)
      .or(`provider_id.eq.${userRecord.user_id}, request.sender_id.eq.${userRecord.user_id}`)
      .limit(20);

    if (!rooms || rooms.length === 0) {
      setChats(MOCK_CHATS);
      setLoading(false);
      return;
    }

    const chatList = [];
    for (const room of rooms) {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('message, sent_at')
        .eq('room_id', room.delivery_id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const otherUserId = room.request.sender_id === userRecord.user_id ? room.request.provider_id : room.request.sender_id;
      const { data: otherUser } = await supabase.from('users').select('first_name, last_name').eq('user_id', otherUserId).single();

      chatList.push({
        id: room.delivery_id,
        name: otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'Unknown',
        lastMessage: lastMsg?.message || 'No messages',
        time: lastMsg?.sent_at ? new Date(lastMsg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      });
    }

    if (chatList.length === 0) {
      setChats(MOCK_CHATS);
    } else {
      setChats(chatList);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchChats);
    return unsubscribe;
  }, []);

  const openChat = (item: any) => {
    setSelectedRoom(item);
    setMessages([
      { id: '1', sender: 'other', text: 'Hello! I will pick up your package.', time: '10:00 AM' },
      { id: '2', sender: 'me', text: 'Great, I’ll be waiting.', time: '10:01 AM' },
    ]);
  };

  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    const msg = { id: Date.now().toString(), sender: 'me', text: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, msg]);
    setNewMsg('');
    // If you want real sending, implement supabase insert here
  };

  if (selectedRoom) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedRoom(null)}>
            <Ionicons name="arrow-back" size={24} color="#F27024" />
          </TouchableOpacity>
          <Text style={styles.chatHeaderName}>{selectedRoom.name}</Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={[styles.msgBubble, item.sender === 'me' ? styles.myMsg : styles.theirMsg]}>
              <Text>{item.text}</Text>
              <Text style={{ fontSize: 10, color: '#6B7280', textAlign: 'right', marginTop: 4 }}>{item.time}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={newMsg}
              onChangeText={setNewMsg}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: '800' }}>Messages</Text>
        <Text style={{ fontSize: 18, fontWeight: '400', marginBottom: 16 }}>Chats</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#F27024" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatRow} onPress={() => openChat(item)}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: '#6B7280', marginTop: 4 }}>{item.lastMessage || item.lastMsg}</Text>
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{item.time}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#E5E7EB' },
  chatHeaderName: { fontSize: 18, fontWeight: '700', marginLeft: 16 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMsg: { backgroundColor: '#F27024', alignSelf: 'flex-end' },
  theirMsg: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start' },
  inputBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtn: { backgroundColor: '#F27024', borderRadius: 50, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#CC5500', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
});