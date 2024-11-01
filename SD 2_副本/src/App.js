import React, { useState } from 'react';
import axios from 'axios';
import { OpenAI } from 'openai';
import './App.css';

function App() {
    const [naturalLanguage, setNaturalLanguage] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [imageBlobUrl, setImageBlobUrl] = useState('');
    const [loading, setLoading] = useState(false); // 加载状态
    const [inputError, setInputError] = useState(false);

    const openai = new OpenAI({
        apiKey: 'sk-n3AVBXLlQq6NXOlgEQT9bhtHEgGFYZ8vc7L45cYds9KBItHI',
        dangerouslyAllowBrowser: true,
        baseURL: 'https://oneapi.daidr.me/v1'
    });

    const generateSDPrompt = async () => {
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: `Convert the following natural language to a Stable Diffusion prompt: ${naturalLanguage}` }],
            });

            const sdPrompt = response.choices[0].message.content.trim();
            setGeneratedPrompt(sdPrompt);
            return sdPrompt;
        } catch (error) {
            console.error('Error generating prompt:', error);
            alert('生成 SD prompt 时出现错误');
        }
    };

    const generateImage = async () => {
        if (!naturalLanguage.trim()) {
            setInputError(true);
            return;
        }
        setInputError(false);
        setLoading(true);
        const apiUrl = 'http://sd-eb8afe--proxy.fcv3.1279009797310410.cn-hangzhou.fc.devsapp.net/txt2img';

        const sdPrompt = await generateSDPrompt();
        if (!sdPrompt) {
            setLoading(false);
            return;
        }
        const positivePrompt = " ,(full-length portrait: 1.5), (8k, RAW photo, best quality, masterpiece:1.2), (realistic, photo-realistic:1.37), (male:1.3), studio light, white backgrouond, smile，fashion costume design sheet, three views, multi-angle display, clothing design, blueprint"
        const finalPrompt = `${sdPrompt}${positivePrompt}`;

        const payload = {
            prompt: finalPrompt,
            steps: 20,
            width: 512,
            height: 512,
            sampler_name: 'sampler_v2',
            batch_size: 1,
            n_iter: 1,
            send_images: true,
            save_images: true,
            stable_diffusion_model: 'chilloutmix_NiPrunedFp32Fix',
            negative_prompt: "(NSFW:2.0),EasyNegative, paintings, sketches, (worst quality:2), (low quality:2), (normal quality:2), lowres, normal quality, ((monochrome)), ((grayscale)), skin spots, acnes, skin blemishes, age spot, ,extra fingers,fewer fingers, strange fingers, bad hand, fat ass, hole, naked, fat thigh,6 fingers, underwear, nsfw, nude,leg open, fat",

        };

        try {
            const response = await axios.post(apiUrl, payload, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.data.ossUrl && response.data.ossUrl.length > 0) {
                const imageResponse = await axios.get(response.data.ossUrl[0], { responseType: 'blob' });
                const imageBlob = imageResponse.data;

                const imageBlobUrl = URL.createObjectURL(imageBlob);
                setImageBlobUrl(imageBlobUrl);
            } else {
                alert('图像生成失败');
            }
        } catch (error) {
            console.error('Error generating image:', error);
            alert('生成图像时出现错误');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        const link = document.createElement('a');
        link.href = imageBlobUrl;
        link.download = 'generated_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="app-container">
            <div className="input-container">
                <input
                    type="text"
                    value={naturalLanguage}
                    onChange={(e) => setNaturalLanguage(e.target.value)}
                    placeholder="请输入自然语言描述"
                    className="input-box"
                />
                {inputError && <p style={{color: 'red'}}>输入框不能为空！</p>}

                <button onClick={generateImage} className="generate-button">
                    {loading ? '生成中...' : '生成图像'}
                </button>

                <button className="generate-button">
                    <a href="http://sd-eb8afe--sd.fcv3.1279009797310410.cn-hangzhou.fc.devsapp.net" target="_blank"
                       rel="noopener noreferrer">
                        跳转至专业版
                    </a>
                </button>
            </div>

            {loading && (
                <div className="loading-message">
                    <h3>请稍候，正在生成图像...</h3>
                </div>
            )}

            {generatedPrompt && (
                <div className="prompt-container">
                    <h3>生成的 SD Prompt:</h3>
                    <p>{generatedPrompt}</p>
                </div>
            )}

            {imageBlobUrl && (
                <div className="image-container">
                    <h2>生成的图像：</h2>
                    <img src={imageBlobUrl} alt="Generated" className="generated-image" />
                    <br />
                    <button onClick={downloadImage} className="download-button">
                        下载图像
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;


