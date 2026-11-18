import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f0e5' }, page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32, paddingTop: 64, paddingBottom: 48 },
  card: { width: '100%', maxWidth: 570 }, eyebrow: { color: '#718266', letterSpacing: 2.4, fontSize: 11, fontWeight: '700', marginBottom: 18 },
  title: { fontSize: 58, fontWeight: '600', letterSpacing: -2.5, color: '#293d2e' }, subtitle: { color: '#40523e', fontSize: 23, marginTop: 8, marginBottom: 18 },
  detail: { color: '#62705d', fontSize: 16, lineHeight: 24 }, primary: { backgroundColor: '#304d38', paddingVertical: 19, paddingHorizontal: 24, borderRadius: 18, alignItems: 'center', marginVertical: 25 }, primaryText: { color: '#fffdf3', fontSize: 19, fontWeight: '600' },
  label: { fontSize: 13, color: '#40523e', fontWeight: '600', marginBottom: 9 }, input: { borderWidth: 1, borderColor: '#cbd0bc', borderRadius: 12, padding: 15, backgroundColor: '#fffdf5', color: '#293d2e', fontSize: 14 },
  link: { color: '#456647', fontSize: 14, paddingVertical: 12 }, note: { color: '#7a826e', fontSize: 13, lineHeight: 20 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 20 }, secondary: { backgroundColor: '#e2e6d6', borderRadius: 12, padding: 14, alignItems: 'center' }, secondaryText: { color: '#354c37', fontSize: 14, fontWeight: '600' },
  game: { flex: 1, backgroundColor: '#f3f0e5' }, web: { flex: 1, backgroundColor: '#f3f0e5' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f0e5' },
  loading: { position: 'absolute', top: 90, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fffdf5', padding: 18, borderRadius: 20 },
  error: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#f3f0e5', padding: 48, justifyContent: 'center', gap: 12 }, heading: { color: '#293d2e', fontSize: 28, fontWeight: '600' },
  owner: { position: 'absolute', bottom: 18, right: 18, backgroundColor: '#fffdf5c9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }, ownerText: { color: '#687761', fontSize: 11 },
});
