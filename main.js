async function fetchRadioUrls() {
    try {
        // URLを指定
        const categoryUrl = `https://fc.vspo.jp/ja/gallery/category/radio`;

        // HTMLを取得
        const response = await fetch(categoryUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch the URL: ${categoryUrl}`);
        }

        const html = await response.text();

        // DOMParserを使用してHTMLを解析
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // aタグのhref属性をすべて取得
        const links = Array.from(doc.querySelectorAll('a'));

        // 指定のURL形式に一致するものをフィルタリング
        const radioUrls = links
            .map(link => link.href) // 各リンクのhrefを取得
            .filter(href => href.startsWith('https://fc.vspo.jp/ja/gallery/radio')) // 特定のURL形式をチェック
            .filter((href, index, self) => self.indexOf(href) === index); // 重複を削除

        return radioUrls.reverse();
    } catch (error) {
        console.error('Error fetching radio URLs:', error);
        return [];
    }
}

async function fetchAudioTags(url) {
    try {
        // HTMLを取得
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch the URL: ${url}`);
        }

        const html = await response.text();

        // DOMParserを使用してHTMLを解析
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // audioタグをすべて取得
        const audioTags = doc.querySelectorAll('audio');

        // 文字列として取得
        const audioStrings = Array.from(audioTags).map(audio => audio.outerHTML);

        return audioStrings;
    } catch (error) {
        console.error('Error fetching audio tags:', error);
        return [];
    }
}

function getRadioNumbers(urls) {
    // radio${number}形式に変換
    return urls.map(url => {
        const match = url.match(/radio(\d+)/); // radio${number}を抽出
        return match ? `radio${match[1]}` : null; // 該当するものがあれば返す
    }).filter(Boolean); // nullを除外
}

function renderPlayer(radioNumbers, audioTagStrings) {
    const main = document.createElement('div');
    const audioElements = [];

    // プレイヤー生成
    radioNumbers.forEach((number, i) => {
        const row = document.createElement('div');

        // 再生済み情報の確認
        const isPlayed = localStorage.getItem(`radio-${number}`) === 'played';
        const playedText = isPlayed ? '<span style="color: green; margin-left: 10px;">再生済み</span>' : '';

        // 番組タイトルとaudioタグを生成
        row.innerHTML = `<div>${number}${playedText}</div>${audioTagStrings[i]}`;
        const audio = row.querySelector('audio'); // 生成されたaudioタグを取得
        audioElements.push({ audio, row, number }); // 管理用に保存

        // 全体に行を追加
        main.appendChild(row);
    });

    // DOMに追加
    document.body.appendChild(main);

    // 連続再生の設定
    audioElements.forEach((item, index) => {
        const { audio, row, number } = item;

        // 再生終了時の処理
        audio.addEventListener('ended', () => {
            // 再生済み情報を保存
            localStorage.setItem(`radio-${number}`, 'played');

            // 再生済みテキストを更新
            const titleDiv = row.querySelector('div');
            if (!titleDiv.querySelector('span')) {
                titleDiv.innerHTML += '<span style="color: green; margin-left: 10px;">再生済み</span>';
            }

            // 次の音声を再生
            if (index < audioElements.length - 1) {
                audioElements[index + 1].audio.play();
            }
        });
    });
}
async function main() {
    const urls = await fetchRadioUrls();
    const radioNumbers = getRadioNumbers(urls);
    const audioTagStrings = await Promise.all(
        urls.map(async (url) => {
            const tags = await fetchAudioTags(url);
            return tags[0]; // 最初の<audio>タグを取得
        })
    );

    renderPlayer(radioNumbers, audioTagStrings);
}

main();