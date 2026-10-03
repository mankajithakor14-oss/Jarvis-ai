package com.jarvis.ai;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Locale;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final int REQUEST_AUDIO = 1001;
    private static final int REQUEST_SPEECH = 1002;

    private TextView chat;
    private TextView status;
    private EditText input;
    private TextToSpeech tts;

    private final ArrayList<JSONObject> history = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        chat = findViewById(R.id.chat);
        status = findViewById(R.id.status);
        input = findViewById(R.id.input);
        Button send = findViewById(R.id.send);
        Button speak = findViewById(R.id.speak);

        tts = new TextToSpeech(this, result -> {
            if (result == TextToSpeech.SUCCESS) {
                tts.setLanguage(new Locale("gu", "IN"));
            }
        });

        send.setOnClickListener(v -> sendMessage(input.getText().toString().trim()));
        speak.setOnClickListener(v -> startVoice());

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    REQUEST_AUDIO
            );
        }
    }

    private void startVoice() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            status.setText("Speech recognition available નથી.");
            return;
        }

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(
                RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        );
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "gu-IN");
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Jarvis ને કહો...");

        startActivityForResult(intent, REQUEST_SPEECH);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQUEST_SPEECH && resultCode == RESULT_OK && data != null) {
            ArrayList<String> results =
                    data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);

            if (results != null && !results.isEmpty()) {
                String text = results.get(0);
                input.setText(text);
                sendMessage(text);
            }
        }
    }

    private void sendMessage(String message) {
        if (message.isEmpty()) return;

        append("You: " + message);
        input.setText("");
        status.setText("JARVIS વિચારી રહ્યું છે...");

        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("message", message);

                JSONArray h = new JSONArray();
                int start = Math.max(0, history.size() - 16);
                for (int i = start; i < history.size(); i++) {
                    h.put(history.get(i));
                }
                body.put("history", h);

                URL url = new URL(BuildConfig.JARVIS_API_BASE + "/api/index");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                conn.setDoOutput(true);

                OutputStream os = conn.getOutputStream();
                os.write(body.toString().getBytes("UTF-8"));
                os.close();

                int code = conn.getResponseCode();
                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(
                                code >= 400 ? conn.getErrorStream() : conn.getInputStream()
                        )
                );

                StringBuilder result = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) result.append(line);
                reader.close();

                JSONObject json = new JSONObject(result.toString());

                if (code >= 400) {
                    throw new Exception(json.optString("error", "Server error"));
                }

                String reply = json.optString("reply", "No reply");

                JSONObject userItem = new JSONObject();
                userItem.put("role", "user");
                userItem.put("content", message);
                history.add(userItem);

                JSONObject assistantItem = new JSONObject();
                assistantItem.put("role", "assistant");
                assistantItem.put("content", reply);
                history.add(assistantItem);

                runOnUiThread(() -> {
                    append("JARVIS: " + reply);
                    status.setText("JARVIS Ready");
                    speak(reply);
                    handleLocalCommand(reply);
                });

            } catch (Exception e) {
                runOnUiThread(() -> {
                    status.setText("Error");
                    append("Error: " + e.getMessage());
                });
            }
        });
    }

    private void handleLocalCommand(String reply) {
        String marker = "ACTION:OPEN_APP:";
        int index = reply.indexOf(marker);
        if (index < 0) return;

        String pkg = reply.substring(index + marker.length()).split("\\s")[0].trim();
        if (pkg.isEmpty()) return;

        try {
            Intent launch = getPackageManager().getLaunchIntentForPackage(pkg);
            if (launch != null) {
                startActivity(launch);
            } else {
                append("JARVIS: આ app phoneમાં મળતી નથી.");
            }
        } catch (Exception e) {
            append("JARVIS: App open કરી શક્યો નહીં.");
        }
    }

    private void speak(String text) {
        if (tts != null) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "jarvis_reply");
        }
    }

    private void append(String text) {
        chat.append(text + "\n\n");
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
