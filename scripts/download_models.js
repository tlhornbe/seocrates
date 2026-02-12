import fs from 'fs';
import path from 'path';

const modelId = 'Xenova/all-MiniLM-L6-v2';
const files = [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'special_tokens_map.json',
    'onnx/model_quantized.onnx'
];

const modelDir = path.resolve('public', 'models', 'all-MiniLM-L6-v2');

// Ensure directory exists
if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
}

const downloadFile = async (file) => {
    const url = `https://huggingface.co/${modelId}/resolve/main/${file}`;
    const destPath = path.join(modelDir, file);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    console.log(`Downloading ${file}...`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Status ${response.status}`);

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        console.log(`Finished ${file}`);
    } catch (error) {
        console.error(`Failed to download ${file}: ${error.message}`);
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    }
};

const main = async () => {
    for (const file of files) {
        await downloadFile(file);
    }
};

main();
