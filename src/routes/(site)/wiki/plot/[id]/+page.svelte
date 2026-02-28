<script lang="ts">
  import { plotsLookup } from '../../../../../data';
  import { isArray } from '../../../../../misc';
  import Translation from '../../../../../view/translation.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let plot = $derived(plotsLookup[data.id]);
</script>

{#if plot}
  <h1><Translation translationKey={plot.name} /></h1>
  <ul>
    <li>
      <b><Translation translationKey="Roles" />:</b>
      <ul>
        {#each Object.entries(plot.roles ?? {}) as [id, role]}
          <li>
            <Translation translationKey={`:${id}:`} link />

            ({#if isArray(role)}{role[0]}-{role[1]}{:else if role}{role}{/if})
          </li>
        {/each}
      </ul>
    </li>
    {#if (plot.rules ?? []).length > 0}
      <li>
        <b><Translation translationKey="Rules" />:</b>
        <ul>
          {#each plot.rules ?? [] as rule}
            <li>
              {#if rule.type == 'Script creation'}
                <Translation translationKey="Script creation" />:
                <Translation translationKey={rule.description} link />
              {:else if rule.type == 'Delayed Loss condition: Protagonists Death'}
                <Translation translationKey="Delayed Loss condition: Protagonists Death" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else if rule.type == 'Loss condition: Tragedy'}
                <Translation translationKey="Loss condition: Tragedy" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else if rule.type == 'Mandatory'}
                <Translation translationKey="Mandatory" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else if rule.type == 'Mandatory Loss condition: Protagonists Death'}
                <Translation translationKey="Mandatory Loss condition: Protagonists Death" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else if rule.type == 'Optional'}
                <Translation translationKey="Optional" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else if rule.type == 'Optional Loss condition: Protagonists Death'}
                <Translation translationKey="Optional Loss condition: Protagonists Death" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else if rule.type == 'Optional Loss condition: Tragedy'}
                <Translation translationKey="Optional Loss condition: Tragedy" />:
                {#if (rule.description?.length ?? 0) > 0}
                  <Translation translationKey={rule.description} link />
                {/if}
                <dl>
                  <dt><Translation translationKey="Prerequisite" /></dt>
                  <dd><Translation translationKey={rule.prerequisite} link /></dd>
                  {#if rule.timing?.length > 0}
                    <dt><Translation translationKey="Timing" /></dt>
                    <dd>
                      {#each rule.timing as t, i}
                        {#if i > 0},
                        {/if}
                        <Translation translationKey={t} link />
                      {/each}
                    </dd>
                  {/if}
                  {#if rule.timesPerDay !== undefined}
                    <dt><Translation translationKey="Times per day" /></dt>
                    <dd>{rule.timesPerDay}</dd>
                  {/if}
                  {#if rule.timesPerLoop !== undefined}
                    <dt><Translation translationKey="Times per loop" /></dt>
                    <dd>{rule.timesPerLoop}</dd>
                  {/if}
                </dl>
              {:else}
                <Translation translationKey={rule.type} />
                <Translation translationKey={rule.description} link />
              {/if}
            </li>
          {/each}
        </ul>
      </li>
    {/if}
  </ul>
{:else}
  <p><Translation translationKey="Plot not found" /></p>
{/if}
