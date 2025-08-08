<script lang="ts">
    import {Textarea} from "$lib/components/ui/textarea/index"
    import {Button} from "$lib/components/ui/button/index";
    
    let text = $state("");
    let handling = $state(false);
    type Message = { role: "user" | "assistant"; content: string };
    let chat = $state<Message[]>([]);

    async function handleSend() {
        if (!text) return;
        chat.push({ role: "user", content: text });
        handling = true;

        // Add a placeholder for the streaming AI response
        chat.push({ role: "assistant", content: "" }); // <-- FIXED

        // Exclude the last (empty) assistant message for the prompt
        const messages = chat.slice(0, -1);

        const response = await fetch("/api/ai", { 
            body: JSON.stringify({ messages }),
            method: "POST",
        });
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let aiResponse = "";
        while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            aiResponse += decoder.decode(value, { stream: true });
            // Update the last assistant message as the stream arrives
            chat[chat.length - 1].content = aiResponse;
        }

        handling = false;
        text = "";
    }
</script>

<div class="bg-gradient-to-b from-neutral-900 via-indigo-900 to-slate-900 w-screen h-screen flex flex-col items-center">
    <div class="mt-8 mb-4 flex flex-col items-center">
        <span class="text-4xl text-white/80 font-bold">Privacy AI</span>
        <span class="text-lg text-white/40">No account, no data stealing.</span>
        <a href="https://github.com/pieterjansen8" class="text-blue-400">pieter jansen</a>
    </div>
    <div class="flex-1 w-full max-w-xl px-2 overflow-y-auto bg-white/5 rounded-xl shadow-inner mb-4 py-4">
        {#each chat as message}
            <div class="flex mb-3 {message.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[80%] px-4 py-2 rounded-2xl shadow 
                    {message.role === 'user' 
                        ? 'bg-indigo-500 text-white rounded-br-none self-end' 
                        : 'bg-neutral-800 text-indigo-100 rounded-bl-none self-start'}">
                    <span class="block text-xs mb-1 opacity-60">{message.role === 'user' ? 'You' : 'AI'}</span>
                    <span>{message.content}</span>
                </div>
            </div>
        {/each}
        {#if handling}
            <div class="flex justify-start mb-3">
                <div class="max-w-[80%] px-4 py-2 rounded-2xl bg-neutral-800 text-indigo-100 rounded-bl-none self-start opacity-70 italic">
                    Waiting for AI response...
                </div>
            </div>
        {/if}
    </div>
    <form class="w-full max-w-xl px-2 pb-8 flex gap-2" on:submit|preventDefault={handleSend}>
        <Textarea
            class="flex-1 h-14 bg-neutral-900/80 text-white/80 border border-indigo-400/40 rounded-xl p-4 shadow-lg placeholder:text-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Type your text here..."
            bind:value={text}
            disabled={handling}
        />
        <Button 
            type="submit"
            size="lg"
            class="h-14 px-6 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition"
            disabled={!text || handling}
        >
            Send
        </Button>
    </form>
</div>