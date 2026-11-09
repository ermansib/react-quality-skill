import { Image, ScrollView, Text, TouchableOpacity } from 'react-native';

type BadListProps = { names: string[] };

export function BadList({ names }: BadListProps) {
  return (
    <ScrollView>
      {names.map((name) => (
        <TouchableOpacity key={name}>
          <Text allowFontScaling={false}>{name}</Text>
        </TouchableOpacity>
      ))}
      <Image source={{ uri: 'https://example.com/a.png' }} />
    </ScrollView>
  );
}
